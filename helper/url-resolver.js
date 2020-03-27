const requirejs = require('requirejs'),
      matchAll = require('match-all');

function initUrlResolver(rjsConfig, minify) {
    let minResolver = `${rjsConfig.dir}/requirejs-min-resolver` + (minify ? '.min.js' : '.js'),
        contents = this.opts.plugins.fs.readFileSync(minResolver, 'utf8'),
        modulesToExclude = matchAll(contents, /match\(\/(.*?)\/\)/gm).toArray().join('|');

    requirejs.define('_@rurlResolverInterceptor', function () {

        let newContextConstr = requirejs.s.newContext;

        function getUrl(context, url) {
            if (!url.match(modulesToExclude)) {
                url = minify ? url.replace(/(\.min)?\.js$/, '.min.js') : url;
            }
            return url;
        }

        requirejs.s.newContext = function () {
            let newCtx = newContextConstr.apply(requirejs.s, arguments),
                newOrigNameToUrl = newCtx.nameToUrl;


            newCtx.nameToUrl = function () {
                return getUrl(newCtx, newOrigNameToUrl.apply(newCtx, arguments));
            };

            return newCtx;
        };
    });

    requirejs(['_@rurlResolverInterceptor'], () => {
    });

}

module.exports = {initUrlResolver};