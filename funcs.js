module.exports = function() {
    this.check_node_version_and_quit_if_it_is_too_low = function () {
        const nodeVersion = process.versions.node;
        const nodeVersionNumbers = nodeVersion.split('.').map(v => parseInt(v));
        if (nodeVersionNumbers[0] < 10 || nodeVersionNumbers[1] < 10) {
            this.bail(
                `The node version this is running under is: ${nodeVersion}\n` +
                'i18n-janitor requires Node 10.10.0+.\n' +
                'Please switch to a supported version and try again.'
            );
        }
    };

    this.bail = function(message) {
        if (message) console.error(`\n${message}`);
        console.error("\nExiting...");

        process.exit();
    };
};
