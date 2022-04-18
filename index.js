const path = require('path');
const Image = require('@11ty/eleventy-img');
const cast = require('sass-cast');
const { images, queries } = require(path.join('data', 'responsive'));

class ResponsiveImageFunctions {
    constructor(options={ images, queries }) {
        let {
            defaults = {},
            images, queries,
            sassPrefix = 'image',
        } = options;
        this.defaults = defaults;
        this.images = images;
        this.queries = queries;
        this.sassPrefix = sassPrefix;

        this.resize = this.resize.bind(this);
        this.generatePicture = this.generatePicture.bind(this);
        this.generateSources = this.generateSources.bind(this);
    }

    /**
     * @param {string} image - file or url of the source image
     * @param {Object} [options] - options used by eleventy-img
     * @returns {Promise<Object>} - a promise resolving to a metadata object for the generated images
     */
    resize(image, options={}) {
        return Image(image, {
            ...this.defaults,
            ...options
        });
    }

    async generatePicture(image, kwargs={}) {
        let { widths, formats, ...properties } = kwargs;
        delete properties.__keywords;

        let metadata = await this.resize(image, { widths, formats });
        return Image.generateHTML(metadata, {
            alt: '',
            ...properties,
        });
    }

    async generateSources(...args) {
        let html = await this.generatePicture(...args);
        return html.replace(/(^<picture>|<\/picture>$)/g, '');
    }

    // maybe better to define as a function returning an object, bind 'this' in the constructor
    // any way to get the config (this.resize) to carry over from wherever this is invoked to sass execution?
    get sassFunctions() {  
        const resizeFunction = `${this.sassPrefix}-resize($src, $widths: null, $formats: null)`;
        const queriesFunction = `${this.sassPrefix}-queries($src, $widths: null, $formats: jpeg, $orientation: landscape portrait)`;
        return {
            [resizeFunction]: async args => {
                let src = args[0].assertString('src').text;
                let widths = args[1].asList.toArray().map(n => n.value || n.realNull);
                let formats = args[2].asList.toArray().map(s => s.text || s.realNull);

                let metadata = await this.resize(src, widths, formats);
                return cast.toSass(metadata);
            },
            [queriesFunction]: async args => {
                let src = args[0].assertString('src').text;
                let widths = args[1].realNull
                    && args[1].asList.toArray().map(n => n.value || n.realNull);
                let formats = args[2].asList.toArray().map(s => s.text || s.realNull);
                let orientation = args[3].realNull
                    && args[3].asList.toArray().map(s => s.text);

                if (!widths) // fallback based on orientation
                    widths = Object.entries(this.images)
                        .reduce((flat, [o, sizes]) => {
                            if (!orientation.includes(o))
                                return flat;
                            let widths = sizes.map(s => s.w);
                            return flat.concat(widths);
                        }, [])
                        .filter((w, i, arr) => arr.indexOf(w) === i);

                let mediaQueries = [];
                let metadata = await this.resize(src, widths, formats);
                metadata = Object.values(metadata)[0];

                let metaByWidth = {};

                for (let o of orientation) {
                    let mq = { orientation: orientation.length > 1 && o };
                    this.queries[o].forEach(({ w, images }, i, queries) => {
                        let next = queries[i + 1];
                        mq = {
                            ...mq,
                            maxWidth: i > 0 && w,
                            minWidth: next && next.w
                        };
                        images.forEach((image, j, images) => {
                            let next = images[j + 1];
                            let imageMeta = metaByWidth[image.w];
                            if (imageMeta === undefined) {
                                imageMeta = metadata.find(m => m.width === image.w);
                                metaByWidth[image.w] = imageMeta;
                            }
                            let { url, sourceType, format } = imageMeta;
                            mq = {
                                ...mq,
                                maxResolution: j > 0 && image.dppx,
                                minResolution: next && next.dppx,
                                url, sourceType, format
                            };
                            mediaQueries.push(mq);
                        });
                    });
                }

                return cast.toSass(mediaQueries);
            },
        };
    }
}

module.export = ResponsiveImageFunctions;
