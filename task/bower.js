'use strict';
module.exports = function() {
  // Global variables
  const gulp    = this.gulp,
        plugins = this.opts.plugins,
        config  = this.opts.configs,
        themes  = plugins.getThemes();

  themes.forEach(name => {
    const theme = config.themes[name];

    plugins.fs.stat(config.projectPath + theme.src + '/bower.json',function(err, stat){
        if (err == null) {
          plugins.bower({
            directory: config.projectPath + theme.src + '/bower_components',
            cwd: config.projectPath + theme.src
          })
          .pipe(gulp.dest(config.projectPath + theme.src + '/bower_components'))
            console.log("bower: bower.json has found");
        } else {
            console.log("bower: no bower.json found - " + err.code);
        }
    });

  });

};
