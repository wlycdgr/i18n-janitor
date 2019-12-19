// 3rd party imports
const fs = require('fs');
const jsonfile = require('jsonfile');

// 1st party imports
const c = require('./constants.js');

// Needed because './' in require calls is always relative to the invoking file's location,
// And this tool is installed globally rather than in the directory of the project where it is applied
const cwd = process.cwd();

const toolDirExists = () => fs.existsSync(`${cwd}/${c.TOOL_DIRNAME}`);
const configFileExists = () => fs.existsSync(`${cwd}/${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`);

function check_node_version_and_quit_if_it_is_too_low () {
    const nodeVersion = process.versions.node;
    const nodeVersionNumbers = nodeVersion.split('.').map(v => parseInt(v));
    if (nodeVersionNumbers[0] < 10 || nodeVersionNumbers[1] < 10) {
        this.bail(
            `The node version this is running under is: ${nodeVersion}\n` +
            'i18n-janitor requires Node 10.10.0+.\n' +
            'Please switch to a supported version and try again.'
        );
    }
}

function print_cli_header() {
    console.log("");
    console.log("*** i81n-janitor ***");
    console.log("");
}

function verify_tool_folder_exists_and_make_it_if_it_doesnt() {
    console.log(`Looking for './${c.TOOL_DIRNAME}/'`);
    if (toolDirExists()) {
        console.log(`./${c.TOOL_DIRNAME}/ found.`);
    }
    else {
        console.log(`./${c.TOOL_DIRNAME}/ not found. Creating.`);
        fs.mkdirSync(`${cwd}/${c.TOOL_DIRNAME}`);
        if (toolDirExists()) {
            console.log(`./${c.TOOL_DIRNAME}/ successfully created`);
        }
        else {
            bail(`Could not create tool directory './${c.TOOL_DIRNAME}'. Try checking permissions.`);
        }
    }
}

function verify_config_file_exists_and_make_a_default_one_if_it_doesnt() {
    console.log(`Looking for config file at './${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`);
    if (!configFileExists()) {
        console.log("Config file not found.");
        console.log("Writing default config file.");
        fs.writeFileSync(`${cwd}/${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`, _defaultConfigFileString());
        if (!configFileExists()) {
            bail(`Could not write default config file to './${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}'. Try checking permissions.`);
        } else {
            console.log('Default config file successfully created.');
            console.log('Please consult the file for configuration instructions.');
            console.log('After you are happy with the configuration, run i18n-janitor again.');
            bail();
        }
    }
}

function load_config_file() {
    console.log('Config file found.');
    return require(`${cwd}/${c.TOOL_DIRNAME}/${c.CONFIG_FILENAME}`);
}

function load_tokens(filepath) {
    const messages = jsonfile.readFileSync(`${filepath}`, {throws: false});

    if (messages === null) {
        bail(`The default locale token file is missing or invalid.\nCheck the 'defaultLocaleTokensFilepath' value in the config file and the token file's syntax`);
    }

    return Object.keys(messages);
}

/**
 * Recursively collect the filepaths of files that
 * satisfy the supplied extension and file system location conditions
 * @param [Array|object] locationsAndExtensions             An object or array of objects specifying directory trees and file extensions to check
 * @param [string] root                                     The directory to look relative to
 * @param [string Array] filepaths							The matching filepaths
 * @returns [string Array] filepaths						The matching filepaths
 */
function load_filepaths(locationsAndExtensions, root = '.', filepaths = []) {
    const target = locationsAndExtensions;

    if (Array.isArray(target)) {
        locationsAndExtensions.forEach((locationAndExtensions) => {
            filepaths = load_filepaths(locationAndExtensions, root, filepaths);
        });
    } else {
        const dirEntries = fs.readdirSync(`${root}/${target.dir}`, { withFileTypes: true });

        dirEntries.forEach((dirEntry) => {
            if (dirEntry.isDirectory()) {
                filepaths = load_filepaths(
                    {
                        dir: `${target.dir}/${dirEntry.name}`,
                        extensions: target.extensions
                    },
                    root,
                    filepaths
                );
            } else if (dirEntry.isFile()) {
                if (target.extensions.some(extension => dirEntry.name.endsWith(extension))) {
                    filepaths.push(`${root}/${target.dir}/${dirEntry.name}`);
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

function bail(message) {
    if (message) console.error(`\n${message}`);
    console.error("\nExiting...");

    process.exit();
}

function _defaultConfigFileString() {
    return (
        `
// Instructions:
// 1. Modify the defaultLocaleTokensFilepath and locationsToLookForTokens property values as needed
// 2. Once you're done, run i18n-janitor again
module.exports = {
    defaultLocaleTokensFilepath: "_locales/en/messages.json",
    locationsToLookForTokens: [
        {
            dir: "app",
            extensions: [
                ".jsx",
                ".js"
            ]
        },
        {
            dir: "src",
            extensions: [
                ".js"
            ]
        },
    ],
};
    `);
}

module.exports = {
    check_node_version_and_quit_if_it_is_too_low,
    print_cli_header,
    verify_tool_folder_exists_and_make_it_if_it_doesnt,
    verify_config_file_exists_and_make_a_default_one_if_it_doesnt,
    load_config_file,
    load_tokens,
    load_filepaths,
    find_unused_tokens,
    bail,
};
