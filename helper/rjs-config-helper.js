const phantom = require("phantom");

 function collect(baseUrl, pageUrl) {

    let executor = async (resolve) => {
        const instance = await phantom.create();
        const page = await instance.createPage();

        page.on('onLoadFinished', () => {
            page.evaluate(function () {
                return Object.keys(window.require.s.contexts._.defined).join('\n');
            }).then((result) => {
                result = result.replace(/mixins!?.*$\n/gm, '');

                resolve({name: "modules", result});
                instance.exit();
            });
        });
        await page.open(`${baseUrl}${pageUrl}`);
    };

    return new Promise(executor);
}

function getConfig(url) {

    let executor = async (resolve) => {
        const instance = await phantom.create();
        const page = await instance.createPage();

        page.on('onLoadFinished', () => {

            page.evaluate(function () {
                let res = {
                    map: window.require.s.contexts._.config.map,
                    shim: window.require.s.contexts._.config.shim,
                    paths: window.require.s.contexts._.config.paths
                };

                return JSON.stringify(res);

            }).then((result) => {
                result = result.replace(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/gm, "empty:");

                resolve({name: 'config', result});

                instance.exit();
            });
        });
        await page.open(url);
    };

    return new Promise(executor);
}


module.exports = {collect, getConfig};