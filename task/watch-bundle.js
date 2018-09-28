'use strict';
module.exports = function() {
  this.opts.plugins.runSequence('bundle', 'watch');
};
