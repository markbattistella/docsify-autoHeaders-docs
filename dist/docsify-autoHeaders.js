/*
 * docsify-autoHeaders.js v6.0.0
 * -- https://markbattistella.github.io/docsify-autoHeaders/
 * -- Copyright (c) 2021 Mark Battistella (@markbattistella)
 * -- Licensed under MIT
 */



// MARK: - policy
'use strict';





// MARK: - global values

// -- default values
const docsifyAutoHeaders = {
    separator: '',
    levels: 6,
    sidebar: true,
    debug: false
},

    // -- list of errors and warnings
    defaultErrors = {
        unknownError: 'AutoHeaders: something went massively wrong! Contact @markbattistella :/',
        configNotSet: 'AutoHeaders: config settings not set',
        headingNumbersSet: 'AutoHeaders: the @autoHeaders: numbers are not set or are incorrectly formatted',
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

        // -- are we affecting the sidebar
        let sidebar = (

            // -- if user has hidden sidebar no rendering
            window.$docsify.hideSidebar ?

                false :

                // -- if not hiding sidebar
                // -- user has said to render sidebar
                // -- and not using a custom sidebar
                docsifyAutoHeaders.sidebar === true && window.$docsify.loadSidebar == undefined ?

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

        // -- are we outputting to console
        let debug = (
            docsifyAutoHeaders.debug === true ?
                true : false
        );

        // return the array
        return {
            separator: separator,
            levels: levels,
            sidebar: sidebar,
            debug: debug
        }
    };





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
        optionsSidebar = autoHeadersOptions.sidebar,
        optionsDebug = autoHeadersOptions.debug,

        // debug: log message
        log = (message) => {
            optionsDebug ? console.log(message) : '';
        },

        // debug: warn message
        warn = (message) => {
            optionsDebug ? console.warn(message) : '';
        },

        // safe heading range
        isHeadingInRange = (value, min, max) => {
            return value >= min && value <= max;
        },

        // check if the array items are positive numbers
        isPositiveNumber = (number) => (number >= 0),

        // -- reset the numbering
        resetBelowLevels = (currentLevel, headingStartingNumbers) => {
            for (let i = +currentLevel + 1; i <= 6; i++) {
                headingStartingNumbers[i] = -1;
            }
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

                    log(defaultErrors.headingLevelRange);
                    return;

                }

                // -- check if is object
            } else if (
                typeof optionsLevel === 'object' && optionsLevel !== null
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
    // ------- get the first line to check if we're autoheadering
    hook.beforeEach((content) => {

        // check first characters
        if (content.startsWith('@autoHeader:')) {

            // get the first line of data
            const getFirstLine = content.split('\n')[0];

            // get everything after the `:`
            getHeadingNumber = getFirstLine.split(':')[1];

            // there is no data to continue
            if (
                !getHeadingNumber           ||
                getHeadingNumber === null   ||
                getHeadingNumber === ''
            ) {

                return getHeadingNumber = null;

            } else {

                // make an array from the separator
                getHeadingNumber = getHeadingNumber.split(optionsSeparator);

                // dont work with too many items in the array
                if (getHeadingNumber.length > 6) {

                    // set the headerNumber to null
                    return getHeadingNumber = null;

                } else {

                    // pad in the extra array items
                    getHeadingNumber = getHeadingNumber.concat(
                        new Array(6)      // add a new array upto 6 items
                            .fill(0)      // fill it with zeros
                    )
                        .slice(0, 6)      // cut off after 6 items
                        .map(x => +x);    // map the Strings to Int
                    }

                    // -- run the script only if valid
                    autoHeaderNumbering();
            }

            // return the cleaned content
            return content.replace(getFirstLine, '');
        }
    });





    // -- custom function
    function autoHeaderNumbering() {

         // -- do we have the headers array
         if (getHeadingNumber === null) {
            optionsDebug ? warn(defaultErrors.invalidStartValue) : '';
            return;
        }

        // -- validate the array is all numeric
        if (getHeadingNumber.every(isNaN)) {
            optionsDebug ? warn(defaultErrors.nonNumericValue) : '';
            return;
        }


        // -- numbering on the sidebar
        if (optionsSidebar) {

            // MARK: - before rendered to HTML
            // ------- if were using the sidebar then number it here
            hook.beforeEach((content) => {

                // the numbers are all positive
                if (getHeadingNumber.every(isPositiveNumber)) {

                    // -- what markdown we are looking for
                    const levels = ['# ', '## ', '### ', '#### ', '##### ', '###### '];

                    // -- get the line heading level
                    const getLevel = (line) => {
                        if (line.startsWith(levels[0])) return 1; //h1
                        if (line.startsWith(levels[1])) return 2;
                        if (line.startsWith(levels[2])) return 3;
                        if (line.startsWith(levels[3])) return 4;
                        if (line.startsWith(levels[4])) return 5;
                        if (line.startsWith(levels[5])) return 6; //h6
                    };

                    // -- add each line as an array item
                    let lines = content.split('\n');

                    // -- set the starting values minus 1
                    const headingStartingNumbers = [
                        0,                       // null
                        getHeadingNumber[0] - 1, // h1
                        getHeadingNumber[1] - 1, // h2
                        getHeadingNumber[2] - 1, // h3
                        getHeadingNumber[3] - 1, // h4
                        getHeadingNumber[4] - 1, // h5
                        getHeadingNumber[5] - 1, // h6
                    ];

                    // track the first run for custom levels
                    let isThisFirstRun = [
                        true,                   // null
                        true, 	                // h1 run yet
                        true, 	                // h2 run yet
                        true, 	                // h3 run yet
                        true, 	                // h4 run yet
                        true, 	                // h5 run yet
                        true 	                // h6 run yet
                    ];

                    // -- search regex
                    const headingRegex = new RegExp(
                        `^#{${optionsLevelStart},${optionsLevelFinish}}\\s+.*`
                    );

                    // -- loop over lines
                    for (var line in lines) {

                        // -- some defaults
                        let numberText = '';
                        let heading = lines[line];

                        // -- get the level number
                        let level = getLevel(heading);

                        //if not a header continue to next line
                        if (level === undefined || !headingRegex.test(heading)) {
                            continue;
                        }

                        // add `1` to the array numbers
                        headingStartingNumbers[level]++;

                        // reset all level below except for the first run
                        if (!isThisFirstRun[level]) {
                            resetBelowLevels(level, headingStartingNumbers);
                        }

                        // set the first run to false
                        isThisFirstRun[level] = false;

                        // loop through the headings
                        for (var levelNumber = 1; levelNumber <= 6; levelNumber++) {
                            if (levelNumber <= level) {

                                numberText += headingStartingNumbers[levelNumber] + optionsSeparator

                            } else {

                                // -- exit out of numbering the sub
                                continue;

                            }
                        }

                        // -- prepend the numbering to the heading
                        lines[line] = (
                            levels[level - 1] +
                            numberText +
                            heading.substr(level, heading.length)
                        );
                    }

                    // add the number outside the heading
                    content = lines.join("\n");
                }

                // return the newly formatted data
                return content;
            });

        } else {

            // MARK: - before rendered to HTML
            // ------- not using sidebar only body
            hook.afterEach((html, next) => {

                // setup empty container
                const container = document.createElement('div');

                // the numbers are all positive
                if (getHeadingNumber.every(isPositiveNumber)) {

                    // insert the old html into the container
                    container.innerHTML = html;

                    // -- find all the headers
                    const contentHeaders = container.querySelectorAll(
                        'h1, h2, h3, h4, h5, h6'
                    );

                    // -- set the starting values minus 1
                    const headingStartingNumbers = [
                        0,                       // null
                        getHeadingNumber[0] - 1, // h1
                        getHeadingNumber[1] - 1, // h2
                        getHeadingNumber[2] - 1, // h3
                        getHeadingNumber[3] - 1, // h4
                        getHeadingNumber[4] - 1, // h5
                        getHeadingNumber[5] - 1, // h6
                    ];

                    // track the first run for custom levels
                    let isThisFirstRun = [
                        true,                   // null
                        true, 	                // h1 run yet
                        true, 	                // h2 run yet
                        true, 	                // h3 run yet
                        true, 	                // h4 run yet
                        true, 	                // h5 run yet
                        true 	                // h6 run yet
                    ];

                    // limit the heading tag number in search
                    const headingRegex = new RegExp(
                        `^H([${optionsLevelStart}-${optionsLevelFinish}])$`
                    );

                    // -- work on the titles
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
                            resetBelowLevels(elementLevel, headingStartingNumbers);
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

                // insert the newly formatted data into parser
                next(container.innerHTML);
            });
        }
    }
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
