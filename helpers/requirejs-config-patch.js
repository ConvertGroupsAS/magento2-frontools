import fs from 'fs-extra'

export default function onModuleBundleComplete(data) {
    if (!this.bundleConfigAppended) {
        this.bundleConfigAppended = true;
        const bundleConfigPlaceholder = `
                (function (require) {
                require.config({});
                })(require);`;

        fs.appendFileSync(this.bundlesConfigOutFile, bundleConfigPlaceholder);
    }
}
