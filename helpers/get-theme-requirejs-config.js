import fs from 'fs-extra';
import path from 'path';

import {env, themes, projectPath, tempPath} from '../helpers/config'

let requirejs = require('requirejs');

const filesExt = env.minify ? '.min.js' : '.js'
const httpPathRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm

function modifyDependency(fn) {
    requirejs = fn;
}

function getThemeRequirejsConfig(themePath, contextName) {
    const themeRequirejsConfig = fs.readFileSync(path.join(themePath, `requirejs-config${filesExt}`), 'utf8');
    const f = new Function('require', themeRequirejsConfig);
    const origConfig = requirejs.config;
    const origRequire = requirejs;

    modifyDependency(function() { });
    
    requirejs.config = function(c) {
        c.context = contextName;
        c.deps = null;
        origConfig.apply(this, arguments)
    }

    f(requirejs);

    modifyDependency(origRequire);
    requirejs.config = origConfig;

    const themeConfig = requirejs.s.contexts[contextName].config;
    const config = {
        map: {...themeConfig.map},
        shim: {...themeConfig.shim},
        paths: {...themeConfig.paths}
    }

    const s = JSON.stringify(config).replace(httpPathRegex, 'empty:');
    return JSON.parse(s);
}

export default getThemeRequirejsConfig