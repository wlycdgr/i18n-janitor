// 3rd party imports
const fs = require('fs');
const jsonfile = require('jsonfile');

// 1st party imports
const c = require('./constants.js');

// Needed because './' in require calls is always relative to the invoking file's location,
// And this tool is installed globally rather than in the directory of the project where it is applied
const cwd = process.cwd();

const configFilepath = `${cwd}/${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`;

const resultsFilepath = `${cwd}/${c.TOOL_DIRNAME}/${c.RESULTS_FILENAME}`;
const toolDirpath = `${cwd}/${c.TOOL_DIRNAME}`;
const toolDirExists = () => fs.existsSync(`${toolDirpath}`);
const configFileExists = () => fs.existsSync(`${configFilepath}`);
const resultsFileExists = () => fs.existsSync(`${resultsFilepath}`);

function check_node_version_and_quit_if_it_is_too_low () {
    const nodeVersion = process.versions.node;
    const nodeVersionNumbers = nodeVersion.split('.').map(v => parseInt(v));
    if (nodeVersionNumbers[0] < 10 || (nodeVersionNumbers[0] === 10 && nodeVersionNumbers[1] < 10)) {
        _bail(
            `The node version this is running under is: ${nodeVersion}\n` +
            'i18n-janitor requires Node 10.10.0+.\n' +
            'Please switch to a supported version (for example, by running `nvm use lts/dubnium`) and try again.'
        );
    }
}

function parse_cli_argument() {
    return process.argv.length > 1 ? process.argv[2] : '';
}

function create_tool_folder_if_it_doesnt_exist() {
    console.log(`Looking for './${c.TOOL_DIRNAME}/'`);
    if (toolDirExists()) {
        console.log(`./${c.TOOL_DIRNAME}/ found.`);
    }
    else {
        console.log(`./${c.TOOL_DIRNAME}/ not found. Creating.`);
        fs.mkdirSync(`${toolDirpath}`);
        if (toolDirExists()) {
            console.log(`./${c.TOOL_DIRNAME}/ successfully created`);
        }
        else {
            _bail(`Could not create tool directory './${c.TOOL_DIRNAME}'.`);
        }
    }
}

function create_default_config_file_if_it_doesnt_exist() {
    console.log(`Looking for config file at ./${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`);
    if (!configFileExists()) {
        console.log("Config file not found.");
        console.log("Writing default config file.");
        fs.writeFileSync(`${configFilepath}`, _defaultConfigFileString());
        if (!configFileExists()) {
            _bail(`Could not write default config file to ./${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}.`);
        } else {
            console.log('Default config file successfully created.');
            console.log('Please consult the file for configuration instructions.');
            console.log('When done configuring, run i18n-janitor find.');
            _bail();
        }
    }
}

function quit_if_tool_folder_doesnt_exist() {
    if(!toolDirExists()) {
        _bail(`The tool directory ${toolDirpath} does not exist.\nGenerate it with i18n-janitor init and try again.`);
    }
}

function quit_if_config_file_doesnt_exist() {
    if (!configFileExists()) {
        _bail(`The config file ${configFilepath} does not exist.\nGenerate it with i18n-janitor init and try again.`);
    }
}

function load_config_file() {
    if (!configFileExists()) {
        _bail(`Required config file not found at ${configFilepath}`);
    }
    console.log(`Loading configuration from ./${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`);
    return require(`${configFilepath}`);
}

function load_tokens(filepath) {
    const messages = jsonfile.readFileSync(`${filepath}`, {throws: false});

    if (messages === null) {
        _bail(`The default locale token file is missing or invalid.\nCheck the 'defaultLocaleTokensFilepath' value in the config file and the token file's syntax`);
    }

    return Object.keys(messages);
}

/**
 * Recursively collect the filepaths of files that
 * satisfy the supplied extension and file system location conditions
 * @param [Array|object] locationsAndExtensions             An object or array of objects specifying directory trees and file extensions to check
 * @param [string Array] filepaths							The matching filepaths
 * @returns [string Array] filepaths						The matching filepaths
 */
function load_filepaths(locationsAndExtensions, filepaths = []) {
    const target = locationsAndExtensions;

    if (Array.isArray(target)) {
        locationsAndExtensions.forEach((locationAndExtensions) => {
            filepaths = load_filepaths(locationAndExtensions, filepaths);
        });
    } else {
        const dirEntries = fs.readdirSync(`./${target.dir}`, { withFileTypes: true });

        dirEntries.forEach((dirEntry) => {
            if (dirEntry.isDirectory()) {
                filepaths = load_filepaths(
                    {
                        dir: `${target.dir}/${dirEntry.name}`,
                        extensions: target.extensions
                    },
                    filepaths
                );
            } else if (dirEntry.isFile()) {
                if (target.extensions.some(extension => dirEntry.name.endsWith(extension))) {
                    filepaths.push(`./${target.dir}/${dirEntry.name}`);
                }
            }
        });
    }

    return filepaths;
}

function find_unused_tokens(tokens, filepaths) {
    const tokenMap = new Map();
    tokens.forEach(token => tokenMap.set(token, token));

    filepaths.forEach((filepath) => {
        const fileContents = fs.readFileSync(filepath, 'utf8');

        tokenMap.forEach((token) => {
            if (fileContents.includes(`t('${token}`)) {
                tokenMap.delete(token);
            }
        })
    });

    return Array.from(tokenMap.keys());
}

function save_results(unusedTokens) {
    const filepath = `${resultsFilepath}`;
    const results = {
        unusedTokens,
        timestamp: Date.now()
    };

    // use { replacer: , spaces: } options to format output
    // https://github.com/jprichardson/node-jsonfile/blob/master/index.js
    jsonfile.writeFileSync(filepath, results, { spaces: 4});

    if (!resultsFileExists()) {
        _bail('Could not write results file.');
    }
    else {
        console.log(`Results written to ./${c.TOOL_DIRNAME}/${c.RESULTS_FILENAME}`);
    }
}

function quit_if_results_file_doesnt_exist() {
    if (!resultsFileExists()) {
        _bail(
            `Did not find a results file at ${resultsFilepath}\n` +
            'Please generate it using i18n-janitor find,\n' +
            'Double-check it to make sure it doesn\'t contain any false positives\n' +
            '(for example, keys that are dynamically assembled by the code),\n' +
            'and run i18n-janitor purge again.'
        );
    }
}

function load_unused_tokens_from_results_file() {
    const resultsJSON = jsonfile.readFileSync(`${resultsFilepath}`, {throws: false});

    if (resultsJSON === null) {
        _bail('Error loading results file. Please check that it is valid JSON');
    }
    if (!Array.isArray(resultsJSON.unusedTokens)) {
        _bail('unusedTokens property in results file is missing or invalid. Please check the results file.');
    }

    return resultsJSON.unusedTokens;
}

// locales is an object with 3 properties:
// locales.root: the root directory for localization files
// locales.filename: the locale token filename; should be the same for all locales
// locales.default: the default locale; not used by this function
function load_locale_filepaths(locales, currentDir = '', result = []) {
    if (currentDir === '') { currentDir = locales.root; }

    const dirEntries = fs.readdirSync(`./${currentDir}`, { withFileTypes: true });

    dirEntries.forEach((dirEntry) => {
        if (dirEntry.isDirectory()) {
            result = load_locale_filepaths(
                locales,
                `${currentDir}/${dirEntry.name}`,
                result
            );
        } else if (dirEntry.isFile()) {
            if (locales.filename === dirEntry.name) {
                result.push(`./${currentDir}/${dirEntry.name}`);
            }
        }
    });

    return result;
}

function delete_unused_tokens_from_locale_files(unusedTokens, localeFiles) {
    localeFiles.forEach(localeFile => {
        const tokens = jsonfile.readFileSync(`${localeFile}`, {throws: false});

        if (tokens === null) {
            console.log(`Could not load ${localeFile}. Skipping and continuing.`);
            return;
        }

        unusedTokens.forEach(unusedToken => delete(tokens[unusedToken]));

        // use { replacer: , spaces: } options to format output
        // https://github.com/jprichardson/node-jsonfile/blob/master/index.js
        jsonfile.writeFileSync(`${localeFile}`, tokens, { spaces: 4});

        console.log(`Unused tokens deleted from ${localeFile}.`);
    });

    console.log('Unused token purge complete. Time to rebuild and see what broke!');
    console.log('Thank you and have a nice day :)');
}

function _bail(message) {
    if (message) console.error(`\n${message}`);
    console.error("\nExiting...");

    process.exit();
}

function _defaultConfigFileString() {
    return (
        `
// Instructions:
// 1. Modify the defaultLocaleTokensFilepath and locationsToLookForTokens property values as needed
//      Paths should be relative to the project root
// 2. Once you're done, run i18n-janitor find from the project root
module.exports = {
\tdefaultLocaleTokensFilepath: '_locales/en/messages.json',
\tlocationsToLookForTokens: [
\t\t{
\t\t\tdir: 'app',
\t\t\textensions: [
\t\t\t\t'.jsx',
\t\t\t\t'.js'
\t\t\t]
\t\t},
\t\t{
\t\t\tdir: 'src',
\t\t\textensions: [
\t\t\t\t'.js'
\t\t\t]
\t\t},
\t],
\tlocales: {
\t\troot: '_locales',
\t\tfilename: 'messages.json',
\t}
};
`   );
}

module.exports = {
    check_node_version_and_quit_if_it_is_too_low,
    parse_cli_argument,
    create_tool_folder_if_it_doesnt_exist,
    create_default_config_file_if_it_doesnt_exist,
    quit_if_tool_folder_doesnt_exist,
    quit_if_config_file_doesnt_exist,
    load_config_file,
    load_tokens,
    load_filepaths,
    find_unused_tokens,
    save_results,
    quit_if_results_file_doesnt_exist,
    load_unused_tokens_from_results_file,
    load_locale_filepaths,
    delete_unused_tokens_from_locale_files,
};
