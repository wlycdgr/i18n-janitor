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

const f = require('./funcs.js');

f.check_node_version_and_quit_if_it_is_too_low();

switch (f.parse_cli_argument()) {
    case 'init':
        handle_init_request();
        break;
    case 'find':
        handle_find_request();
        break;
    case 'purge':
        handle_purge_request();
        break;
    default:
        print_instructions();
}

function handle_init_request() {
    console.log('Doing init stuff');
    f.verify_tool_folder_exists_and_make_it_if_it_doesnt();
    f.verify_config_file_exists_and_make_a_default_one_if_it_doesnt();
}

function handle_find_request() {
    f.quit_if_tool_folder_doesnt_exist();
    f.quit_if_config_file_doesnt_exist();
    const config = f.load_config_file();
    const tokens = f.load_tokens(config.defaultLocaleTokensFilepath);
    const filepaths = f.load_filepaths(config.locationsToLookForTokens);
    const unusedTokens = f.find_unused_tokens(tokens, filepaths);
    f.save_results(unusedTokens);
}

function handle_purge_request() {
    handle_init_request();
    console.log('Doing purge stuff');
    f.check_that_results_file_exists_and_exit_if_it_doesnt();
   // const config = f.load_config_file();
   // const unusedTokens = f.load_unused_tokens_from_results_file();
   // const localeFiles = f.load_locale_filepaths(config.localeTokensFilepaths);
   // f.delete_unused_tokens_from_locale_files(unusedTokens, localeFiles);

    // check if results file exists
    // if it does not,
    //  exit
    // if it does,
    //  open it & load in the unused token keys
    //  for each locale tokens file
    //      open the file
    //      delete the unused tokens from it:
    //          for each unused_token, execute delete(localeTokensJson.unused_token)
    //      write changes
}

function print_instructions() {
    console.log('* i18n-janitor instructions *\n\n');
    console.log('i18n-janitor init: creates tool directory and default config file');
    console.log('i18n-janitor find: uses config file to find unused tokens and saves results to tool directory');
    console.log('i18n-janitor purge: removes all tokens from the results file produced by `i18n-janitor find` from the locale json files specified in the config file');
}

