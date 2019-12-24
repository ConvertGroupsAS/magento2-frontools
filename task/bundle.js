'use strict';

module.exports = function () {

    const gulp = this.gulp,
        plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme,
        locale = plugins.util.env.locale,
        themeConfig = config.themes[themeName],
        rjsConfigBase = require(config.projectPath + 'dev/tools/frontools/config/build'),
        modules = require(config.projectPath + config.themes[themeName].src + '/modules'),
        deepmerge = require('deepmerge'),
        requirejs = require('requirejs');

    let rjsConfig = deepmerge(modules, rjsConfigBase),
        tasks = [];

    rjsConfig.baseUrl = `${config.projectPath}${themeConfig.dest}/${locale}_tmp`;
    rjsConfig.dir = `${config.projectPath}${themeConfig.dest}/${locale}`;

    tasks.push(new Promise((resolve) => {
        gulp.src(`${config.projectPath}${themeConfig.dest}/${locale}/**/*`)
            .pipe(gulp.dest(`${config.projectPath}${themeConfig.dest}/${locale}_tmp`)).on('end', () => {
            requirejs.optimize(rjsConfig, () => {

                plugins.fs.remove(rjsConfig.baseUrl, err => {
                    if (err) console.log(err);
                    resolve(1);
                })
            })
        })
    }));

    return Promise.all(tasks);
};