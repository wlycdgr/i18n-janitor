# i18n-janitor

### THIS TOOL IS NOT READY FOR USE - THIS WARNING WILL BE REMOVED ONCE IT IS

A CLI tool for identifying and removing unused localization tokens in browser extensions that use the Chrome i18n localization file format.
Created to help maintain the Ghostery browser extension.

Please note that this is a simple, naive tool that does literal
string comparison and will not work as expected if you dynamically
generate i18n token names in your code. Therefore, unless you are
very sure that your code is not doing that, treat the tool's findings
as a starting point and confirm/edit them by hand before running the purge operation.

### To use:
1. `yarn global add i18n-janitor` (or npm equivalent)
2. Navigate to desired project directory
3. `i18n-janitor`
4. Follow CLI prompts
5. Repeat steps 2 through 4 as needed
6. `yarn global remove i18n-janitor` (or npm equivalent)
