module.exports = function () {

    const gulp = this.gulp,
        plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme,
        locale = plugins.util.env.locale,
        themeConfig = config.themes[themeName],
        themes = plugins.getThemes(),
        rjsConfigBase = require(config.projectPath + 'dev/tools/frontools/config/build'),
        deepmerge = require('deepmerge'),
        requirejs = require('requirejs');

    let tasks = [];

    themes.forEach(name => {
        const modules = require(config.projectPath + config.themes[name].src + '/modules');

        config.themes[name].locale.forEach(locale => {
            tasks.push(new Promise((resolve) => {
                let rjsConfig = deepmerge(modules, rjsConfigBase);
                rjsConfig.baseUrl = `${config.projectPath}${config.themes[name].dest}/${locale}_tmp`;
                rjsConfig.dir = `${config.projectPath}${config.themes[name].dest}/${locale}`;

                gulp.src(`${config.projectPath}${config.themes[name].dest}/${locale}/**/*`)
                    .pipe(gulp.dest(`${config.projectPath}${config.themes[name].dest}/${locale}_tmp`)).on('end', () => {
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