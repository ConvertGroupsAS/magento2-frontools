import { src, dest } from 'gulp'
import yarn from 'gulp-yarn'
import fs from 'fs-extra'

import {
  env,
  projectPath,
  themes
} from './config'

export default (name) => {

  const theme = themes[name];
  const themePath = (projectPath + theme.src);

  try {
    fs.accessSync(themePath + '/package.json', fs.constants.F_OK);
    fs.accessSync(themePath + '/yarn.lock', fs.constants.F_OK);

    const gulpTask = src([themePath + '/package.json', themePath + '/yarn.lock'])
      .pipe(yarn());

    return gulpTask;
  } catch (error) {
    console.error(error);
  }
}
