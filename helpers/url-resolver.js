import fs from 'fs-extra'
import requirejs from 'requirejs'
import matchAll from 'match-all'
import path from 'path'

import {env} from './config'

const filesExt = env.minify ? '.min.js' : '.js'

export default function initUrlResolver(themePath) {
    const minResolver = fs.readFileSync(path.join(themePath, `requirejs-min-resolver${filesExt}`), 'utf8');
    const modulesToExclude = matchAll(minResolver, /match\(\/(.*?)\/\)/gm).toArray().join('|');

    requirejs.define('_@rurlResolverInterceptor', function () {

        const newContextConstr = requirejs.s.newContext;

        function getUrl(context, url) {
            if (!url.match(modulesToExclude)) {
                url = url.replace(/(\.min)?\.js$/, filesExt);
            }
            return url;
        }

        requirejs.s.newContext = function () {
            const newCtx = newContextConstr.apply(requirejs.s, arguments);
            const newOrigNameToUrl = newCtx.nameToUrl;

            newCtx.nameToUrl = function () {
                return getUrl(newCtx, newOrigNameToUrl.apply(newCtx, arguments));
            };

            return newCtx;
        };
    });

    requirejs(['_@rurlResolverInterceptor']);
}
