const requirejs = require('requirejs');
    matchAll = require("match-all");

function initUrlResolver (rjsConfig) {

    let minResolver = `${rjsConfig.dir}/requirejs-min-resolver.min.js`, //todo minify
        contents = this.opts.plugins.fs.readFileSync(minResolver, 'utf8');
    modulesToExclude = matchAll(contents, /match\(\/(.*?)\/\)/gm).toArray().join('|');

    requirejs.define('urlResolverInterceptor', function () {

        let newContextConstr = requirejs.s.newContext;

        function getUrl(context, url) {

            if(context.config.baseUrl === rjsConfig.dir && !url.match(modulesToExclude)){
                url = url.replace(/(\.min)?\.js$/, '.min.js');
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

    requirejs(['urlResolverInterceptor'], () => { });

}
module.exports = {initUrlResolver};