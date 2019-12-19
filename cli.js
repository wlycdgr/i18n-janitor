#!/usr/bin/env node
/**
 * Possibly Unused i18n Token Finder
 * Key word: POSSIBLY
 *
 * Looks for i18n tokens that MAY be unused by the code
 * Since some tokens are generated dynamically, the list generated by this script
 * should ALWAYS be verified manually before removing any of the tokens in it
 *
 * Ghostery i18n Tools
 * http://www.ghostery.com/
 *
 * Copyright 2019 Ghostery, Inc. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0
 */

const fs = require('fs');
const jsonfile = require('jsonfile');
const { exec } = require('child_process');

exec('nvm use lts/dubnium');

// Constants
const TOOL_DIRNAME = 'i18n-janitor';
const CONFIG_FILENAME = 'config.js';
const RESULTS_DIRNAME = 'results';
const RESULTS_FILENAME = "unused_tokens.txt";

function _makeDirIfNeeded(path) {
    if (!fs.existsSync(path)) { fs.mkdirSync(path); }
}

function _writeResultsToDisk(unusedTokens) {
    const filepath = `${RESULTS_DIR}/${project}/${RESULTS_FILENAME}`;

    _makeDirIfNeeded(RESULTS_DIR);
    _makeDirIfNeeded(`${RESULTS_DIR}/${project}`);

    fs.writeFileSync(
        filepath,
        unusedTokens.join('\n')
    );
}




//
//
// function findUnusedTokens () {
//     console.time('unused-i18n-token-finder');
//
//     const projects = _getProjects(CONFIG_FILE);
//     projects.forEach((project) => {
//         const tokens = _loadTokens(project);
//         const filepaths = _loadFilepaths(project.root, project.search_filepaths);
//         const unusedTokens = _findUnusedTokens(tokens, filepaths);
//         _writeResultsToDisk(project.name, unusedTokens);
//     });
//
//     console.log('\nPLEASE NOTE:');
//     console.log('Since some i18n tokens are generated dynamically,')
//     console.log('and since some others are formatted in a non-standard way,');
//     console.log('the lists generated by this script should ALWAYS');
//     console.log('be verified manually before removing any of the tokens in them.');
//     console.log('\nThe results are in ./results/[project]/unused_tokens.txt\n');
//
//     console.timeEnd('unused-i18n-token-finder');
// }

function bail(message) {
    if (message) console.error(`\n${message}`);
    console.error("\nExiting...");

    process.exit();
}

function _findUnusedTokens(tokens, filepaths) {
    tokens = tokens.map(token => ({ value: token, isUsed: false }));

    filepaths.forEach((filepath) => {
        const fileContents = fs.readFileSync(filepath, 'utf8');
        tokens.forEach((token) => {
            if (token.isUsed) { return; }

            // THE TEST
            if (fileContents.includes(`t('${token.value}`)) {
                token.isUsed = true;
            }
        });
    });

    const unusedTokens =
        (tokens.filter(token => token.isUsed === false))
            .map(token => token.value);

    return unusedTokens;
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

        console.log(dirEntries);

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


function load_tokens(filepath) {
    const messages = jsonfile.readFileSync(`${filepath}`, {throws: false});

    if (messages === null) {
        bail(`The default locale token file is missing or invalid.\nCheck the 'defaultLocaleTokensFilepath' value in the config file and the token file's syntax`);
    }

    return Object.keys(messages);
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

function _logOutConfig(c) {
    console.log(c);
    console.log(c.defaultLocaleTokensFilepath);
    console.log(c.locationsToLookForTokens);
}

function _createDefaultConfigFile() {
}

// Needed because './' in require calls is always relative to the invoking file's location,
// And this tool is installed globally rather than in the directory of the project where it is applied
const cwd = process.cwd();
console.log(`cwd: ${cwd}`);

const toolDirExists = () => fs.existsSync(`${cwd}/${TOOL_DIRNAME}`);
const configFileExists = () => fs.existsSync(`${cwd}/${TOOL_DIRNAME}/${CONFIG_FILENAME}`);

function print_cli_header() {
    console.log("");
    console.log("*** i81n-janitor ***");
    console.log("");
}

function check_node_version_and_quit_if_it_is_too_low() {
    const nodeVersion = process.versions.node;
    const nodeVersionNumbers = nodeVersion.split('.').map(v => parseInt(v));
    if (nodeVersionNumbers[0] < 10 || nodeVersionNumbers[1] < 10) {
        bail(
            `The node version this is running under is: ${nodeVersion}\n` +
            'i18n-janitor requires Node 10.10.0+.\n' +
            'Please switch to a supported version and try again.'
        );
    }
}

function verify_tool_folder_exists_and_make_it_if_it_doesnt() {
    console.log(`Looking for './${TOOL_DIRNAME}/'`);
    if (toolDirExists()) {
        console.log(`./${TOOL_DIRNAME}/ found.`);
    }
    else {
        console.log(`./${TOOL_DIRNAME}/ not found. Creating.`);
        fs.mkdirSync(`${cwd}/${TOOL_DIRNAME}`);
        if (toolDirExists()) {
            console.log(`./${TOOL_DIRNAME}/ successfully created`);
        }
        else {
            bail(`Could not create tool directory './${TOOL_DIRNAME}'. Try checking permissions.`);
        }
    }
}

function verify_config_file_exists_and_make_a_default_one_if_it_doesnt() {
    console.log(`Looking for config file at './${TOOL_DIRNAME}/${CONFIG_FILENAME}`);
    if (!configFileExists()) {
        console.log("Config file not found.");
        console.log("Writing default config file.");
        fs.writeFileSync(`${cwd}/${TOOL_DIRNAME}/${CONFIG_FILENAME}`, _defaultConfigFileString());
        if (!configFileExists()) {
            bail(`Could not write default config file to './${TOOL_DIRNAME}/${CONFIG_FILENAME}'. Try checking permissions.`);
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
    return require(`${cwd}/${TOOL_DIRNAME}/${CONFIG_FILENAME}`);
}

// START OF EXECUTION
check_node_version_and_quit_if_it_is_too_low();
print_cli_header();
verify_tool_folder_exists_and_make_it_if_it_doesnt();
verify_config_file_exists_and_make_a_default_one_if_it_doesnt();
// We exit at this point if the config file did not exist
// Otherwise, we keep going:
const config = load_config_file();
const tokens = load_tokens(config.defaultLocaleTokensFilepath);
const filepaths = load_filepaths(config.locationsToLookForTokens);
console.log(filepaths);
//_logOutConfig(filepaths);

// console.log('Loading tokens');
// const tokens = _loadTokens()
// const configFileExists = fs.existsSync(`${cwd}/i18n-janitor.config.js`);
//
// if (configFileExists) {
//     console.log("...config file found!");
//     const config = require(`${cwd}/i18n-janitor.config.js`);
//     _logOutConfig(config);
//
//     const tokens = _loadTokens(config.defaultLocaleTokensFilepath);
//     const filepaths = _loadFilepaths('.', config.locationsToLookForTokens);
//     const unusedTokens = _findUnusedTokens(tokens, filepaths);
//     console.log("UNUSED TOKENS:");
//     console.log(unusedTokens);
//
//     _writeResultsToDisk(unusedTokens);
// }
// else {
//     console.log("Config file not found.");
//     console.log("Creating default config file.");
//     _createDefaultConfigFile();
//     console.log("Default config file 'i18n-janitor.config.js' created in root directory.");
//     console.log("Please consult the file for instructions on specifying janitorial parameters.");
//     console.log("After you're happy with your configuration, run i18n-janitor again.");
// }

// // CLI
// console.log("");
// console.log("*** i18n-tools ***");
// console.log("f Find unused tokens");
// console.log("p Purge unused tokens");
// console.log("");
//
// const readline = require('readline');
//
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//     prompt: 'q Quit | h Instructions: '
// });
//
// rl.prompt();
//
// rl.on('line', (line) => {
//     switch (line.trim()) {
//         case 'f':
//             console.log('looking for unused tokens...');
//             findUnusedTokens();
//             break;
//         case '2':
//             console.log('number two!');
//             break;
//         case 'Q':
//         case 'q':
//             rl.close();
//         default:
//             console.log('Please make a valid selection.');
//             break;
//     }
//     rl.prompt();
// }).on('close', () => {
//     console.log('Have a great day!');
//     process.exit(0);
// });

