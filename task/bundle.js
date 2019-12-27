module.exports = function (done) {

    const gulp = this.gulp,
        plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme,
        minify = plugins.util.env.minify,
        locale = plugins.util.env.locale,
        themeConfig = config.themes[themeName],
        themes = plugins.getThemes(),
        rjsConfigBase = require(config.projectPath + 'dev/tools/frontools/config/build'),
        deepmerge = require('deepmerge'),
        initUrlResolver = require('../helper/url-resolver').initUrlResolver.bind(this),
        requirejs = require('requirejs');

    let modulesToExclude = '',
        tasks = [];

    themes.forEach(name => {
        const modules = require(config.projectPath + config.themes[name].src + '/modules');

        config.themes[name].locale.forEach(locale => {
            rjsConfigBase.baseUrl = `${config.projectPath}${config.themes[name].dest}/${locale}_tmp`;
            rjsConfigBase.dir = `${config.projectPath}${config.themes[name].dest}/${locale}`;

            tasks.push(new Promise((resolve) => {
                let rjsConfig = deepmerge(modules, rjsConfigBase);

                initUrlResolver(rjsConfig);

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