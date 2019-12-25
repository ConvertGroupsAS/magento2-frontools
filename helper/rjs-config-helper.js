const phantom = require("phantom");

function collect(baseUrl, pageUrl) {

    let executor = (resolve) => {
        let _ph, _page;
        phantom.create(['--load-images=no'], {logLevel: 'error'}).then((ph) => {
            _ph = ph;
            return _ph.createPage();
        }).then((page) => {
            _page = page;
            return page.open(`${baseUrl}${pageUrl}`);
        }).then((status) => {
            return _page.evaluate(function () {
                return Object.keys(window.require.s.contexts._.defined).join('\n');
            })
        }).then((result) => {
            result = result.replace(/mixins!?.*$\n/gm, '');
            resolve({name: "modules", result});
            _ph.exit();
        }).catch((e) => {
            console.log(e);
            _ph.exit();
        });
    };

    return new Promise(executor);
}

function getConfig(url) {

    let executor = (resolve) => {
        let _ph, _page;
        phantom.create(['--load-images=no'], {logLevel: 'error'}).then((ph) => {
            _ph = ph;
            return _ph.createPage();
        }).then((page) => {
            _page = page;
            return page.open(url);
        }).then((status) => {
            return _page.evaluate(function () {
                let res = {
                    map: window.require.s.contexts._.config.map,
                    shim: window.require.s.contexts._.config.shim,
                    paths: window.require.s.contexts._.config.paths
                };

                return JSON.stringify(res);
            })
        }).then((result) => {
            result = result.replace(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm, "empty:");
            resolve({name: 'config', result});
            _ph.exit();
        }).catch((e) => {
            console.log(e);
            _ph.exit();
        });
    };

    return new Promise(executor);
}

module.exports = {collect, getConfig};