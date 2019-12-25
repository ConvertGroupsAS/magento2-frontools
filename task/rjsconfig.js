module.exports = function(done){
    const plugins = this.opts.plugins,
        config = this.opts.configs,
        themeName = plugins.util.env.theme,
        locale = plugins.util.env.locale,
        themeConfig = config.themes[themeName],
        {collect, getConfig} = require('../helper/rjs-config-helper'),
        taskConfig = require(config.projectPath + 'dev/tools/frontools/config/rjs')[locale];


    let tasks = taskConfig.pages.map(page => {
        return collect(taskConfig.baseUrl, page.url);
    });

    tasks.push(getConfig(taskConfig.baseUrl));

    Promise.all(tasks).then((results) => {

        let allrows = results.filter(res => res.name === "modules").map(res => res.result).join('\n').split('\n'),
            requirejsConfig = JSON.parse(results.find(res => res.name === "config").result),
            map = new Map(),
            grouped = {};

        allrows.forEach(row => {
            if (map.has(row)) {
                let count = map.get(row);
                map.set(row, ++count);
            } else {
                map.set(row, 1)
            }
        });

        map.forEach((v, k) => {
            if (!grouped[v]) {
                grouped[v] = []
            }
            grouped[v].push(k)
        });

        let m = Math.max(...Object.keys(grouped).map(k => parseInt(k)));

        requirejsConfig.modules = [{
                    name: 'bundles/default',
                    create: true,
                    exclude: [ ],
                    include: grouped[m]
                }];

        plugins.fs.writeFile(`${config.projectPath}${themeConfig.src}/modules.json`, JSON.stringify(requirejsConfig), err => {
            if (err) console.log(err);
            console.log('Rjs config successfully generated');
            done();
        });
    });
};