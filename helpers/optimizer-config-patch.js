import fs from 'fs-extra'
import filesize from 'filesize'
import path from 'path'

export default function onModuleBundleComplete(data) {

    const stats = fs.statSync(path.join(this.dir, data.path));
    console.log(`${this.theme}   ${this.locale}/${data.path} generated with ${data.included.length} modules included [${filesize(stats.size)}]`)

    if (!this.bundleConfigAppended) {
        this.bundleConfigAppended = true;
        const bundleConfigPlaceholder = `
                (function (require) {
                require.config({});
                })(require);`;

        fs.appendFileSync(this.bundlesConfigOutFile, bundleConfigPlaceholder);
    }
}
