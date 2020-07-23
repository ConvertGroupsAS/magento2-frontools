import { src, dest } from 'gulp'
import requirejs from 'requirejs'
import deepmerge from 'deepmerge'
import fs from 'fs-extra'
import path from "path";

import getThemes from '../helpers/get-themes'
import { env, themes, projectPath, tempPath } from '../helpers/config'
import loadConfig from '../helpers/config-loader'

import onModuleBundleComplete from '../helpers/requirejs-config-patch'
import initUrlResolver from '../helpers/url-resolver'
// const initUrlResolver = require('../helpers/url-resolver').initUrlResolver.bind(this)

const rjsConfigBase = loadConfig('build.json');
const httpPathRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm
const filesExt = env.minify ? '.min.js' : '.js'

rjsConfigBase.onModuleBundleComplete = onModuleBundleComplete


export const bundle = (done) => {

    const tasks = [];
    const themesToBundle = env.theme ? [env.theme] : getThemes();

    themesToBundle.forEach(name => {
        const themeTempSrc = path.join(tempPath, themes[name].dest)
        let bundle = require(`${themeTempSrc}/bundle`);

        themes[name].locale.forEach(locale => {
            const contextName = `${name}_${locale}`;
            rjsConfigBase.dir = `${projectPath}${themes[name].dest}/${locale}`;
            rjsConfigBase.baseUrl = `${rjsConfigBase.dir}_tmp`;

            /*---------------- local require config start -----------------------*/
            const projectReqConf = fs.readFileSync(`${rjsConfigBase.dir}/requirejs-config${filesExt}`, 'utf8');
            const f = new Function('require', projectReqConf);
            const origConfig = requirejs.config;
            const origRequire = requirejs;
            requirejs = function () {
            }; //todo try require-new module
            requirejs.config = function (c) {
                c.context = contextName;
                c.deps = null;
                origConfig.apply(this, arguments)
            }
            f(requirejs);

            requirejs = origRequire;
            requirejs.config = origConfig;

            bundle.map = Object.assign({}, requirejs.s.contexts[contextName].config.map);
            bundle.shim = Object.assign({}, requirejs.s.contexts[contextName].config.shim);
            bundle.paths = Object.assign({}, requirejs.s.contexts[contextName].config.paths);
            const s = JSON.stringify(bundle).replace(httpPathRegex, "empty:");
            bundle = JSON.parse(s);
            /*---------------- local require config end -----------------------*/

            tasks.push(new Promise(resolve => {
                const rjsConfig = deepmerge(bundle, rjsConfigBase);

                const localRequire = requirejs.config(deepmerge.all([{}, rjsConfigBase, {
                    baseUrl: `${projectPath}${themes[name].dest}/${locale}`,
                    context: contextName,
                    modules: rjsConfig.modules
                }]));


                rjsConfig.modules.forEach((module, i, list) => {
                    const notFoundModules = [];
                    module.include.forEach(module => {  //todo to requirejs module

                        let prefix;
                        const id = module;
                        const index = module ? module.indexOf('!') : -1;

                        if (index > -1) {
                            prefix = module.substring(0, index);
                            module = module.substring(index + 1, module.length);
                        }

                        if (!prefix) {
                            module += '.js';
                        }

                        let url = localRequire.toUrl(module);
                        if (!prefix) {
                            url = env.minify ? url.replace(/(\.min)?\.js$/, filesExt) : url
                        }

                        if (!fs.existsSync(url)) {
                            notFoundModules.push(id);
                        }
                    });

                    list[i].include = module.include.filter(module => notFoundModules.indexOf(module) < 0);
                });
                delete requirejs.s.contexts[contextName];

                if (env.minify) {
                    initUrlResolver(rjsConfig, env.minify);
                    rjsConfig.bundlesConfigOutFile = rjsConfig.bundlesConfigOutFile.replace(/(\.min)?\.js$/, filesExt)
                }
                src(`${rjsConfigBase.dir}/**/*`)
                    .pipe(dest(rjsConfigBase.baseUrl)).on('end', () => {
                    requirejs.optimize(rjsConfig, () => {
                        fs.remove(rjsConfig.baseUrl, err => {
                            if (err) console.log(err);
                            resolve(1);
                        })
                    })
                })
            }));
        })
    });
    return Promise.all(tasks);
};