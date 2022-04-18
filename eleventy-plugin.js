const ResponsiveImages = require('./index');

const filterify = func => async (...filterArgs) => {
    let args = [...filterArgs];
    let cb = args.pop();
    try {
        let result = await func(...args);
        cb(null, result);
    } catch (error) {
        cb(error);
    }
};

let configured;

module.exports = configured;

module.exports.plugin = (eleventyConfig, options={}) => {
    configured = new ResponsiveImages(options);
    const { resize, generateSources, generatePicture } = configured;

    // Nunjucks
    eleventyConfig.addNunjucksAsyncFilter('resize', resize);
    eleventyConfig.addNunjucksAsyncFilter('img', filterify(generateSources));
    eleventyConfig.addNunjucksAsyncShortcode('img', generateSources);
    eleventyConfig.addNunjucksAsyncFilter('picture', filterify(generatePicture));
    eleventyConfig.addNunjucksAsyncShortcode('picture', generatePicture);
};
