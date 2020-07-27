import fs from 'fs-extra'
import path from 'path'

import {env} from '../helpers/config'

let requirejs = require('requirejs')

const filesExt = env.minify ? '.min.js' : '.js'
const absoluteUrlRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm

function modifyDependency(fn) {
    requirejs = fn;
}

function getThemeRequirejsConfig(themePath, context) {
    const themeRequirejsConfig = fs.readFileSync(path.join(themePath, `requirejs-config${filesExt}`), 'utf8');
    const f = new Function('require', themeRequirejsConfig);
    const origConfig = requirejs.config;
    const origRequire = requirejs;

    modifyDependency(function() { });
    
    requirejs.config = function(c) {
        c.context = context;
        c.deps = null;
        origConfig.apply(this, arguments)
    }

    f(requirejs);

    modifyDependency(origRequire);
    requirejs.config = origConfig;

    const themeConfig = requirejs.s.contexts[context].config;
    const config = {
        map: {...themeConfig.map},
        shim: {...themeConfig.shim},
        paths: {...themeConfig.paths}
    }

    const s = JSON.stringify(config).replace(absoluteUrlRegex, 'empty:');
    return JSON.parse(s);
}

export default getThemeRequirejsConfig