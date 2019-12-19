// https://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules
module.exports = Object.freeze({
    TOOL_DIRNAME: 'i18n-janitor',
    CONFIG_FILENAME: 'config.js',
    RESULTS_DIRNAME: 'results',
    RESULTS_FILENAME: "unused_tokens.txt"
});
