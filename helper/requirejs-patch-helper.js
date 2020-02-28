const fs = require('fs');

function onModuleBundleComplete(data) {
    if (this.bundleConfigAppended) {
        return;
    }
    this.bundleConfigAppended = true;

    // bundlesConfigOutFile requires a simple require.config call in order to modify the configuration
    const bundleConfigPlaceholder = `
                (function (require) {
                require.config({});
                })(require);`;

    fs.appendFileSync(this.bundlesConfigOutFile, bundleConfigPlaceholder);
}

module.exports = onModuleBundleComplete;