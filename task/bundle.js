module.exports = function (done) {

    const gulp = this.gulp,
        plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme,
        minify = plugins.util.env.minify,
        themeConfig = config.themes[themeName],
        themes = plugins.getThemes(),
        rjsConfigBase = require(config.projectPath + 'dev/tools/frontools/config/build'),
        deepmerge = require('deepmerge'),
        initUrlResolver = require('../helper/url-resolver').initUrlResolver.bind(this),
        requirejs = require('requirejs');

    let tasks = [];

    themes.forEach(name => {
        const modules = require(`${config.projectPath}${config.themes[name].src}/modules`);

        config.themes[name].locale.forEach(locale => {
            rjsConfigBase.dir = `${config.projectPath}${config.themes[name].dest}/${locale}`;
            rjsConfigBase.baseUrl = `${rjsConfigBase.dir}_tmp`;

            tasks.push(new Promise(resolve => {
                let rjsConfig = deepmerge(modules, rjsConfigBase);

                if (minify) {
                    initUrlResolver(rjsConfig);
                    rjsConfig.bundlesConfigOutFile = rjsConfig.bundlesConfigOutFile.replace(/(\.min)?\.js$/, '.min.js')
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