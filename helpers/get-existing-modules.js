import requirejs from 'requirejs'
import deepmerge from 'deepmerge'
import fs from 'fs-extra'
import path from 'path'

import {env, tempPath, themes} from './config';
import loadConfig from './config-loader';

const optimizerConfigBase = loadConfig('build.json');
const filesExt = env.minify ? '.min.js' : '.js'

export default function getExistingModules(bundle, themePath, contextName) {

    const bundles = [...bundle.modules];

    const localRequire = requirejs.config(deepmerge.all([{}, optimizerConfigBase, {
        baseUrl: themePath,
        context: contextName,
        modules: bundles
    }]));

    bundles.forEach((module, i, list) => {
        const notFoundModules = [];

        module.include.forEach(moduleName => {

            let prefix;
            let moduleId = moduleName;
            const withPlugin = moduleName ? moduleName.includes('!') : false;

            if (withPlugin) {
                [prefix, moduleId] = moduleName.split('!')
            }

            if (!prefix) {
                moduleId += '.js';
            }

            let url = localRequire.toUrl(moduleId);

            if (!prefix) {
                url = env.minify ? url.replace(/(\.min)?\.js$/, filesExt) : url
            }

            if (!fs.existsSync(url)) {
                notFoundModules.push(moduleName);
            }
        });

        list[i].include = module.include.filter(module => !notFoundModules.includes(module));
    });

    return bundles;
}
