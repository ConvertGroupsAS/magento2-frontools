import {src, dest} from 'gulp'
import requirejs from 'requirejs'
import deepmerge from 'deepmerge'
import fs from 'fs-extra'
import path from 'path'

import getThemes from '../helpers/get-themes'
import {env, themes, projectPath, tempPath} from '../helpers/config'
import loadConfig from '../helpers/config-loader'
import getThemeRequirejsConfig from '../helpers/get-theme-requirejs-config'
import onModuleBundleComplete from '../helpers/optimizer-config-patch'
import initUrlResolver from '../helpers/url-resolver'
import getExistingModules from '../helpers/get-existing-modules'

const filesExt = env.minify ? '.min.js' : '.js'

export const bundle = (done) => {
    const themesToBundle = env.theme ? [env.theme] : getThemes();
    const tasks = [];
    const optimizerConfigBase = loadConfig('build.json');

    optimizerConfigBase.onModuleBundleComplete = onModuleBundleComplete;

    themesToBundle.forEach(theme => {

        themes[theme].locale.forEach(locale => {
            const contextName = `${theme}_${locale}`;
            const themePath = path.join(projectPath, themes[theme].dest, locale);
            const themePathTemp = `${themePath}_tmp`;

            const bundle = {
                ...JSON.parse(fs.readFileSync(path.join(tempPath, themes[theme].dest, 'bundle.json'), 'utf8')),
                ...getThemeRequirejsConfig(themePath, contextName)
            }

            tasks.push(new Promise(resolve => {

                const optimizerConfig = deepmerge.all([{}, bundle, optimizerConfigBase, {
                    dir: themePath,
                    baseUrl: themePathTemp,
                    theme,
                    locale,
                }]);

                optimizerConfig.modules = getExistingModules(bundle, themePath, contextName);

                if (env.minify) {
                    initUrlResolver(themePath);
                    optimizerConfig.bundlesConfigOutFile = optimizerConfig.bundlesConfigOutFile.replace(/(\.min)?\.js$/, filesExt)
                }

                src(`${themePath}/**/*`)
                    .pipe(dest(themePathTemp)).on('end', () => {
                    requirejs.optimize(optimizerConfig, () => {
                        fs.remove(themePathTemp, err => {
                            if (err) console.log(err);
                            resolve(1);
                        })
                    })
                })
            }));
        })
    })

    return Promise.all(tasks);
};