# i18n-janitor

A CLI tool for identifying and removing unused localization tokens in browser extensions that use the Chrome i18n localization file format.
Originally created to help maintain the Ghostery browser extension.

Note: this simple tool does literal string comparison to identify unused tokens
and will not work as expected if you dynamically
generate/assemble i18n token names in your code. Treat the tool's findings
as a starting point and confirm/edit them by hand before running the purge operation.

## You'll need to have
* Node 10.10+
* Yarn

## Instructions
1. Install with `yarn global add i18n-janitor`
2. `cd` into the root of the target project directory
3. Run `i18n-janitor` and follow the CLI prompts

To uninstall, run `yarn global remove i18n-janitor`
