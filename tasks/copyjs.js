import globby from 'globby'
import fs from 'fs-extra'
import themeNames from '../helpers/get-themes'

import {
  env,
  projectPath,
  themes
} from '../helpers/config'

export const copyjs = async() => {

  const prod = env.prod || false;
  const execSync = require('child_process').execSync;

  themeNames().forEach(name => {

    const theme = themes[name];

    theme.locale.forEach(locale => {

      const src = projectPath + theme.src;
      const dest = projectPath + theme.dest + '/' + locale;
      const srcPaths = globby.sync(src + '/bower_components/**/**/**.js', {
        nodir: true,
        ignore: '/**/node_modules/**'
      });

      srcPaths.forEach(srcPath => {

        const destPath = srcPath.replace('/web', '').replace(src, dest);

        try {
          fs.ensureFileSync(destPath);
          fs.unlinkSync(destPath);
        } finally {
          prod ? fs.copySync(srcPath, destPath) : fs.symlinkSync(srcPath, destPath);
        }
      });
    });
  });
}
