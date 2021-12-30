/*
 * docsify-autoHeaders.js v5.0.0
 * -- https://markbattistella.github.io/docsify-autoHeaders/
 * -- Copyright (c) 2021 Mark Battistella (@markbattistella)
 * -- Licensed under MIT
 */



// MARK: - policy
'use strict';



// MARK: - global values

// -- default values
const docsifyAutoHeaders = {
    separator: 'dot',
    levels: 6,
    debug: false
},

    // -- list of errors and warnings
    defaultErrors = {
        unknownError: 'AutoHeaders: something went massively wrong! Contact @markbattistella :/',
        configNotSet: 'AutoHeaders: config settings not set',
        headingLevelOrder: 'AutoHeaders: heading start level cannot be greater than finish level',
        headingLevelRange: 'AutoHeaders: heading levels need to be between 1-6',
        invalidStartValue: 'AutoHeaders: the "start" number is empty or null',
        nonNumericValue: 'AutoHeaders: the values provided are not numeric',
        negativeNumbers: 'AutoHeaders: the values are not positive integers'
    },

    // update the default header values
    setAutoHeadersOptions = (docsifyAutoHeaders) => {

        // check for required config settings
        if (!docsifyAutoHeaders.separator || !docsifyAutoHeaders.levels) {
            return console.error(defaultErrors.configNotSet);
        }

        // -- how many levels are we working with
        let levels = (
            docsifyAutoHeaders.levels ?
                docsifyAutoHeaders.levels : 6
        );

        // -- are we outputting to console
        let debug = (
            docsifyAutoHeaders.debug === true ?
                true : false
        );

        // set some defaults
        let separator;

        // what separator are we using
        switch (docsifyAutoHeaders.separator) {

            case 'decimal':
            case '.':
            case 'dot':
                separator = '.';
                break;

            case 'dash':
            case '-':
            case 'hyphen':
                separator = '-';
                break;

            case 'bracket':
            case ')':
            case 'parenthesis':
                separator = ')';
                break;

            default:
                separator = `${docsifyAutoHeaders.separator}`;
                break;
        }

        // return the array
        return {
            separator: separator,
            levels: levels,
            debug: debug
        }
    },

    // show the sidebar
    usingSidebar = (
        // -- if we are hiding it then we're not using it
        window.$docsify.hideSidebar ? false : true
    );





// MARK: - main function
function autoHeaders(hook, vm) {

    // -- check that the options are defined
    if (setAutoHeadersOptions(docsifyAutoHeaders) === undefined) {
        return console.error(defaultErrors.unknownError);
    }

    // variables
    let getHeadingNumber;

    // get the options variables
    const autoHeadersOptions = setAutoHeadersOptions(docsifyAutoHeaders),

        // create new variables
        optionsSeparator = autoHeadersOptions.separator,
        optionsLevel = autoHeadersOptions.levels,
        optionsDebug = autoHeadersOptions.debug,

        // -- debug: log message
        log = (message) => {
            optionsDebug ? console.log(message) : '';
        },

        // -- debug: warn message
        warn = (message) => {
            optionsDebug ? console.warn(message) : '';
        },

        // -- debug: error message
        error = (message) => {
            optionsDebug ? console.error(message) : '';
        },

        // safe heading range
        isHeadingInRange = (value, min, max) => {
            return value >= min && value <= max;
        },

        // get the heading range from options
        setHeadingRange = (headingInputValue) => {
            let headingStartRange = 0;
            let headingFinishRange = 0;

            // -- is it a string
            if (
                typeof optionsLevel === 'string' || 
                typeof optionsLevel === 'number'
            ) {

                // -- is it in range
                if (isHeadingInRange(headingInputValue, 1, 6)) {
                    headingStartRange = 1;
                    headingFinishRange = headingInputValue;

                } else {

                    return log(defaultErrors.headingLevelRange);

                }

                // -- check if is object
            } else if (
                typeof optionsLevel === 'object' &&
                optionsLevel !== null
            ) {

                // -- start has to be less than finish
                if (headingInputValue.start > headingInputValue.finish) {

                    return log(defaultErrors.headingLevelOrder);

                }

                // -- start and finish need to be between 1-6 incl.
                if (
                    isHeadingInRange(headingInputValue.start, 1, 6) &&
                    isHeadingInRange(headingInputValue.finish, 1, 6)
                ) {
                    // headingRegexRange = `H${headingInputValue.start}-${headingInputValue.finish}`;
                    headingStartRange = headingInputValue.start;
                    headingFinishRange = headingInputValue.finish;

                } else {
                    return log(defaultErrors.headingLevelRange);
                }
            }

            return {
                start: headingStartRange,
                finish: headingFinishRange
            }
        },

        // save as constant
        optionsLevelStart = setHeadingRange(optionsLevel).start,
        optionsLevelFinish = setHeadingRange(optionsLevel).finish;





    // MARK: - before rendered to HTML
    hook.beforeEach((content) => {

        // get the first 12 characters
        const getFirstCharacters = content.slice(0, 12);

        // check if beginning with the plugin key
        if (getFirstCharacters === '@autoHeader:') {

            // get the first line of data
            const getFirstLine = content.split('\n')[0];

            // get everything after the `:`
            getHeadingNumber = getFirstLine.split(':')[1];

            // there is no data to continue
            if (
                !getHeadingNumber || 
                getHeadingNumber == null || 
                getHeadingNumber == ''
            ) {

                getHeadingNumber = null;

            } else {

                // make an array from the separator
                getHeadingNumber = getHeadingNumber.split(optionsSeparator);

                // dont work with too many items in the array
                if (getHeadingNumber.length > 6) {

                    // set the headerNumber to null
                    getHeadingNumber = null;

                } else {

                    // pad in the extra array items
                    getHeadingNumber = getHeadingNumber.concat(
                        new Array(6)      // add a new array upto 6 items
                            .fill(0)      // fill it with zeros
                    )
                        .slice(0, 6)      // cut off after 6 items
                        .map(x => +x);    // map the Strings to Int
                }
            }

            // return the cleaned content
            return content.replace(getFirstLine, '');

        } else {

            // set the headerNumber to null
            getHeadingNumber = null;
        }
    });





    // run after the HTML is rendered
    hook.afterEach((html, next) => {

        // setup empty container
        const container = document.createElement('div');

        // insert the old html into the container
        container.innerHTML = html;

        // -- find all the headers
        const contentHeaders = container.querySelectorAll(
            'h1, h2, h3, h4, h5, h6'
        );

        // -- do we have the headers array
        if (getHeadingNumber === null) {

            return optionsDebug ? warn(defaultErrors.invalidStartValue) : '';

        } else {

            // -- validate the array is all numeric
            if (getHeadingNumber.every(isNaN)) {

                return optionsDebug ? warn(defaultErrors.nonNumericValue) : '';

            } else {

                // check if the array items are positive numbers
                const positiveNumber = (number) => (number >= 0);

                // the numbers are all positive
                if (getHeadingNumber.every(positiveNumber)) {

                    const headingStartingNumbers = [
                        0,                       // null
                        getHeadingNumber[0] - 1, // h1
                        getHeadingNumber[1] - 1, // h2
                        getHeadingNumber[2] - 1, // h3
                        getHeadingNumber[3] - 1, // h4
                        getHeadingNumber[4] - 1, // h5
                        getHeadingNumber[5] - 1, // h6
                    ];

                    // track the first run
                    let isThisFirstRun = [
                        true,                   // null
                        true, 	                // h1 run yet
                        true, 	                // h2 run yet
                        true, 	                // h3 run yet
                        true, 	                // h4 run yet
                        true, 	                // h5 run yet
                        true 	                // h6 run yet
                    ];

                    // -- reset the numbering
                    const resetBelowLevels = (currentLevel) => {
                        for (let i = +currentLevel + 1; i <= 6; i++) {
                            headingStartingNumbers[i] = 0;
                        }
                    };

                    // limit the heading tag number in search
                    const headingRegex = new RegExp(
                        `^H([${optionsLevelStart}-${optionsLevelFinish}])$`
                    );

                    // -- work on the titles
                    // contentHeaders.forEach( (element ) => {
                    for (var contentItem in contentHeaders) {

                        // -- some defaults
                        let numberText = '';
                        let heading = contentHeaders[contentItem];

                        // element does not match a heading regex
                        if (!heading || !heading.tagName || !heading.tagName.match(headingRegex)) {
                            continue;
                        }

                        // return the heading level number
                        var elementLevel = RegExp.$1;

                        // add `1` to the array numbers
                        headingStartingNumbers[elementLevel]++;

                        // reset all level below except for the first run
                        if (!isThisFirstRun[elementLevel]) {
                            resetBelowLevels(elementLevel);
                        }

                        // set the first run to false
                        isThisFirstRun[elementLevel] = false;

                        // loop through the headings
                        for (var levelNumber = 1; levelNumber <= 6; levelNumber++) {

                            // if the loop number
                            // is less than the element number
                            // then generate the numbering text
                            if (levelNumber <= elementLevel) {
                                numberText += headingStartingNumbers[levelNumber] + optionsSeparator

                            } else {
                                continue;
                            }
                        }

                        // add the number outside the heading
                        heading.innerHTML = numberText + ' ' + heading.innerHTML.replace(/^[0-9\.\s]+/, '');
                    }
                }
            }
        }

        // insert the newly formatted data into parser
        next(container.innerHTML);
    });





    // MARK: - each time after the data is fully loaded
    hook.doneEach(() => {

        // -- are we using sidebar
        if (usingSidebar) {

            // -- get the navigation sidebar items
            const sidebarList = document.querySelectorAll('div.sidebar-nav ul');

            // -- for all the <ul> items
            sidebarList.forEach( (listItem) => {

                // set the previous item
                let previousElement = listItem.previousElementSibling;

                // exit if null
                if( !previousElement ) return;

                // if <ul> and previous was <li>
                if(
                    listItem.parentNode.nodeName.toLocaleUpperCase() == "UL" && 
                    previousElement.nodeName.toLocaleUpperCase() == "LI" ) {
                
                    // -- move it into the previous
                    previousElement.appendChild(listItem);
                }
            });






            // -- get the elements
            const sidebarListItemsH1 = document.querySelectorAll('div.sidebar-nav > ul > li');
            const sidebarListItemsH2 = document.querySelectorAll('div.sidebar-nav > ul > li > ul > li');
            const sidebarListItemsH3 = document.querySelectorAll('div.sidebar-nav > ul > li > ul > li > ul > li');
            const sidebarListItemsH4 = document.querySelectorAll('div.sidebar-nav > ul > li > ul > li > ul > li > ul > li');
            const sidebarListItemsH5 = document.querySelectorAll('div.sidebar-nav > ul > li > ul > li > ul > li > ul > li > ul > li');
            const sidebarListItemsH6 = document.querySelectorAll('div.sidebar-nav > ul > li > ul > li > ul > li > ul > li > ul > li > ul > li');

            // -- add the attributes
            sidebarListItemsH1.forEach( item => { item.setAttribute("heading", "1"); });
            sidebarListItemsH2.forEach( item => { item.setAttribute("heading", "2"); });
            sidebarListItemsH3.forEach( item => { item.setAttribute("heading", "3"); });
            sidebarListItemsH4.forEach( item => { item.setAttribute("heading", "4"); });
            sidebarListItemsH5.forEach( item => { item.setAttribute("heading", "5"); });
            sidebarListItemsH6.forEach( item => { item.setAttribute("heading", "6"); });



            const sidebarListItems = document.querySelectorAll('div.sidebar-nav li');

            const headingStartingNumbers = [
                0,                       // null
                getHeadingNumber[0] - 1, // h1
                getHeadingNumber[1] - 1, // h2
                getHeadingNumber[2] - 1, // h3
                getHeadingNumber[3] - 1, // h4
                getHeadingNumber[4] - 1, // h5
                getHeadingNumber[5] - 1, // h6
            ];

            // sidebarListItems.forEach( (item) => {
            for (var item in sidebarListItems) {

                let numberText = '';
                let heading = sidebarListItems[item];

                // -- regex to match on
                const headingRegex = new RegExp(
                    `^([${optionsLevelStart}-${optionsLevelFinish}])$`
                );
                
                // element does not match a heading regex
                if( 
                    !heading ||
                    !heading.tagName ||
                    !heading.getAttribute('heading').match(headingRegex)
                ) continue;

                // -- set the number value from the added attribute
                const headingNumber = ( parseInt( heading.getAttribute('heading'), 10) || 0 );

                // return the heading level number
                headingStartingNumbers[ headingNumber ]++;

                // loop from 1-6 (H1 to H6)
                for( var levelNumber = 1; levelNumber <= 6; levelNumber++ ) {

                    // -- if loop index less than attribute heading number
                    if( levelNumber <= headingNumber ) {

                        // -- add the number to the variable
                        numberText += headingStartingNumbers[ levelNumber ] + optionsSeparator

                    // -- exit out if out of range
                    } else {
                        continue;
                    }
                }

                // add to the text
                heading.querySelector('a').innerHTML = numberText + ' ' + heading.querySelector('a').innerHTML
            }
        }
    });
}





// find heading plugin options
window.$docsify.autoHeaders = Object.assign(
    docsifyAutoHeaders,
    window.$docsify.autoHeaders
);
window.$docsify.plugins = [].concat(
    autoHeaders,
    window.$docsify.plugins
);
