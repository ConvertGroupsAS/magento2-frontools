module.exports = function (done) {

    const gulp = this.gulp,
        plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme, //todo check if needed
        minify = plugins.util.env.minify,
        themeConfig = config.themes[themeName],
        themes = plugins.getThemes(),
        rjsConfigBase = require(config.projectPath + 'dev/tools/frontools/config/build'),
        deepmerge = require('deepmerge'),
        initUrlResolver = require('../helper/url-resolver').initUrlResolver.bind(this),
        requirejs = require('requirejs'),
        httpPathRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm,
        filesExt = minify ? '.min.js' : '.js';

    let tasks = [];

    if (!plugins.util.env.pipeline) {
        plugins.runSequence('inheritance');
    }

    themes.forEach(name => {
        let bundle = require(`${config.tempPath}${config.themes[name].dest.replace('pub/static', '')}/bundle`);

        config.themes[name].locale.forEach(locale => {
            let contextName = `${name}_${locale}`;
            rjsConfigBase.dir = `${config.projectPath}${config.themes[name].dest}/${locale}`;
            rjsConfigBase.baseUrl = `${rjsConfigBase.dir}_tmp`;

            /*---------------- local require config start -----------------------*/
            let projectReqConf = plugins.fs.readFileSync(`${rjsConfigBase.dir}/requirejs-config${filesExt}`, 'utf8');
            let f = new Function('require', projectReqConf);
            let origConfig = requirejs.config;
            requirejs.config = function (c) {
                c.context = contextName;
                c.deps = null;
                origConfig.apply(this, arguments)
            }
            f(requirejs);

            bundle.map = Object.assign({}, requirejs.s.contexts[contextName].config.map);
            bundle.shim = Object.assign({}, requirejs.s.contexts[contextName].config.shim);
            bundle.paths = Object.assign({}, requirejs.s.contexts[contextName].config.paths);
            let s = JSON.stringify(bundle).replace(httpPathRegex, "empty:");
            bundle = JSON.parse(s);
            requirejs.config = origConfig;
            /*---------------- local require config end -----------------------*/

            tasks.push(new Promise(resolve => {
                let rjsConfig = deepmerge(bundle, rjsConfigBase);

                let localRequire = requirejs.config(deepmerge.all([{}, rjsConfigBase, {
                    baseUrl: `${config.projectPath}${config.themes[name].dest}/${locale}`,
                    context: contextName,
                    modules: rjsConfig.modules
                }]));


                rjsConfig.modules.forEach((module, i, list) => {
                    let notFoundModules = [];
                    module.include.forEach(module => {  //todo to requirejs module

                        let prefix,
                            id = module,
                            index = module ? module.indexOf('!') : -1;

                        if (index > -1) {
                            prefix = module.substring(0, index);
                            module = module.substring(index + 1, module.length);
                        }

                        if (!prefix) {
                            module += '.js';
                        }

                        let url = localRequire.toUrl(module);
                        if (!prefix) {
                            url = minify ? url.replace(/(\.min)?\.js$/, filesExt) : url
                        }

                        if (!plugins.fs.existsSync(url)) {
                            notFoundModules.push(id);
                        }
                    });

                    list[i].include = module.include.filter(module => notFoundModules.indexOf(module) < 0);
                });
                delete requirejs.s.contexts[contextName];

                if (minify) {
                    initUrlResolver(rjsConfig, minify);
                    rjsConfig.bundlesConfigOutFile = rjsConfig.bundlesConfigOutFile.replace(/(\.min)?\.js$/, filesExt)
                }
                gulp.src(`${rjsConfigBase.dir}/**/*`)
                    .pipe(gulp.dest(rjsConfigBase.baseUrl)).on('end', () => {
                    requirejs.optimize(rjsConfig, () => {
                        plugins.fs.remove(rjsConfig.baseUrl, err => {
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