'use strict';
module.exports = function() {
  // Global variables
  const plugins  = this.opts.plugins,
        config   = this.opts.configs,
        themes   = plugins.getThemes(),
        prod     = plugins.util.env.prod || false,
        execSync = require('child_process').execSync;

  themes.forEach(name => {
    const theme = config.themes[name];
    theme.locale.forEach(locale => {
      const src       = config.projectPath + theme.dest + '/' + locale,
            dest      = '/Users/cernforlife/www/eplehuset-pimcore/website/static',
            srcPaths  = plugins.globby.sync([src + '/css', src + '/images', src + '/js']);

      srcPaths.forEach(srcPath => {
        const destPath = srcPath.replace(['/css','/images','/js'], '').replace(src, dest);
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
