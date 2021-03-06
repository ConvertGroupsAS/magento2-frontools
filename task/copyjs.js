'use strict';
module.exports = function() { // eslint-disable-line func-names
  // Global variables
  const plugins  = this.opts.plugins,
        config   = this.opts.configs,
        themes   = plugins.getThemes(),
        prod     = plugins.util.env.prod || false,
        execSync = require('child_process').execSync;

  themes.forEach(name => {
    const theme = config.themes[name];
    theme.locale.forEach(locale => {
      const src       = config.projectPath + theme.src,
            dest      = config.projectPath + theme.dest + '/' + locale,
            srcPaths  = plugins.globby.sync(src + '/bower_components/**/**/**.js', { nodir: true, ignore: '/**/node_modules/**' });

      srcPaths.forEach(srcPath => {
        const destPath = srcPath.replace('/web', '').replace(src, dest);
        try {
          plugins.fs.ensureFileSync(destPath);
          plugins.fs.unlinkSync(destPath);
        }
        finally {
          prod ? plugins.fs.copySync(srcPath, destPath) : plugins.fs.symlinkSync(srcPath, destPath);
        }
      });
    });
  });
};
