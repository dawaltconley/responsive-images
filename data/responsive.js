const breakpoints = require('./bp.json');
const devices = require('./bp/devices.json');
const imageDimensions = require('./bp/images.json');
const buildData = require('./buildData');

const queries = {
    landscape: [],
    portrait: []
};

let images = {
    landscape: imageDimensions,
    portrait: []
};

// TODO make this functional, so that it can be used with widths specified per image
devices.forEach(d => {
    const resolutions = [];
    if (d.dppx.indexOf(1) < 0)
        d.dppx.push(1); // always include a dppx value of one for queries, to avoid upscaling when screen resizes on larger 1dppx displays
    d.dppx.forEach(dppx => {
        const w = d.w * dppx, h = d.h * dppx;
        const image = imageDimensions.sort((a, b) => b.w - a.w).find((img, i, array) => {
            const next = array[i + 1];
            return !next                                        // true if last
                || w <= next.w && h <= img.h && h > next.h      // or last image high enough for current query, despite next image being wide enough
                || w <= img.w && w > next.w;                    // or last image wide enough for current query
        });
        if (w > image.w) // sanity checks
            console.log(`warning: image width too small for query ${d.w}x${d.h}x${dppx}`);
        if (h > image.h)
            console.log(`warning: image height too small for query ${d.w}x${d.h}x${dppx}`);
        resolutions.push({
            dppx: dppx,
            ...image
        });
    });
    queries.landscape.push({
        w: d.w,
        h: d.h,
        images: resolutions
    });
    if (d.flip) {
        queries.portrait.push({
            w: d.h,
            h: d.w,
            images: resolutions.map(r => {
                let flipped = { w: r.h, h: r.w };
                if(!images.portrait.find(i => i.w === flipped.w && i.h === flipped.h))
                    images.portrait.push(flipped); // this is key...reassigning to images before returning
                return {
                    ...r,
                    ...flipped
                };
            })
        });
        // resolutions.forEach(r => {
        //     if(!images.find(i => i.w === r.h && i.h === r.w))
        //         images.push({ w: r.h, h: r.w });
        // })
        // could push the flipped sizes to images here
    }
});

images.portrait.sort((a, b) => b.h - a.h);

buildData.images = images;
buildData.queries = queries;

/*
 * Smart responsive img shortcodes
 *
 * There are basically two ways of doing what I want to do here
 * 1) parse / interpret user input through the 'sizes' attribute
 * 2) take custom user input (bp/width pairs) and *generate* a sizes attribute based on that
 *
 * Advantage of 2) is I don't have to reverse engineer any browser logic.
 * I'll probably never get to the point of supporting *all* possible
 * media conditions for the sizes attribute anyway.
 *
 * It also allows for unsupported sizes attributes that shouldn't
 * affect image size, i.e. "not print"
 *
 * Advantage of 1) is I don't have to maintain & remember my own syntax.
 * Don't have to worry about breaking changes at user level.
 * Media conditions are hard to express in another format.
 */

/**
 * @constant {RegExp} - used for parsing a CSS value
 */
const valueRegex = /([\d.]+)(\D*)/;

/**
 * Parses a string as a value with an optional unit.
 * @param {string} v - string to parse
 * @return {string[]} - [ value, unit ]
 */
const cssValue = v => {
    let value = v, unit = '';
    if (typeof value === 'string') {
        let match = v.match(valueRegex);
        if (!match) return match;
        [, value, unit] = v.match(valueRegex);
    }
    return [ value, unit ];
};

/**
 * Takes a 2d array representation of the img sizes attribute and a specific device,
 * returning the image widths needed to support that device.
 *
 * @param {Size[]} sizes
 * @param {Device} device - object representing an expected device
 * @param {string} order - whether the widths should be interpreted as 'min' or 'max'
 * @return {Set} unique widths that will need to be produced for the given device
 */
const deviceWidths = (sizes, device, order) => {
    // assume sizes is { conditions, value }
    let imgWidth;

    whichSize:
    for (let { conditions, width } of sizes) {
        imgWidth = width;
        let match;
        for (let { mediaFeature, value: valueString } of conditions) {
            let [ value, unit ] = cssValue(valueString)
            // TODO check unit. only support pixels?
            let match = mediaFeature === 'min-width' && device.w >= value
                || mediaFeature === 'max-width' && device.w <= value
                || mediaFeature === 'min-height' && device.h >= value
                || mediaFeature === 'max-height' && device.h <= value;
            if (!match)
                continue whichSize;
        }
        break whichSize;
    }

    let needWidths = new Set();

    device.dppx.forEach(dppx => {
        let [ scaledWidth, unit='px' ] = cssValue(imgWidth);
        if (unit === 'vw')
            scaledWidth = device.w * scaledWidth / 100;
        scaledWidth = Math.ceil(scaledWidth * dppx);
        needWidths.add(scaledWidth);
    });

    console.log(device, needWidths)

    return needWidths;
};

let sizes = {
    'desktop': '630px',
    'laptop': '550px',
    'tablet': '437px',
    'mobile': '540px',
    'last': '100vw'
};

// /**
//  * Takes an object representation of the img 'sizes' attribute
//  * and returns an array of dimensions, which represent
//  * image copies that should be produced to satisfy these sizes
//  *
//  * @param {Object} mqObject
//  * @param {Object} opt={} - options
//  * @param {string} opt.order - whether to interpret the mqObject as a map of min-widths or max-widths; otherwise inferred from their order
//  * @param {string} opt.minScale - minimum percentage by which to downscale the image (passed as 'factor' to filterSizes)
//  * @return {Dimension[]}
//  */
// const widthsFromSizes = (mqObject, opt={}) => {
//     let {
//         order,
//         minScale
//     } = opt;
//     let sizes = [];
//     let last;
//     for (let bp in mqObject) {
//         let val = cssValue(breakpoints[bp] || bp);
//         val = val ? val[0] : bp;
//         sizes.push([ val, mqObject[bp] ]);
//         if (last && !order)
//             order = last > val ? 'min' : 'max';
//         last = val;
//     }
//
//     let needWidths = devices.reduce((all, device) => {
//         deviceWidths(sizes, device, order).forEach(all.add, all);
//         return all;
//     }, new Set());
//
//     needWidths = Array.from(needWidths);
//
//     return filterSizes(needWidths, minScale);
// };

/**
 * Rewriting to work with sizesQueryStrings
 *
 * @param {string} sizesQueryString
 * @param {Object} opt={} - options
 * @param {string} opt.order - whether to interpret the mqObject as a map of min-widths or max-widths; otherwise inferred from their order
 * @param {string} opt.minScale - minimum percentage by which to downscale the image (passed as 'factor' to filterSizes)
 * @return {Dimension[]}
 */
const widthsFromSizes = (sizesQueryString, opt={}) => {
    let {
        order,
        minScale
    } = opt;
    // let sizes = [];
    // let last;
    // for (let bp in mqObject) {
    //     let val = cssValue(breakpoints[bp] || bp);
    //     val = val ? val[0] : bp;
    //     sizes.push([ val, mqObject[bp] ]);
    //     if (last && !order)
    //         order = last > val ? 'min' : 'max';
    //     last = val;
    // }

    let sizes = parseSizes(sizesQueryString)

    let needWidths = devices.reduce((all, device) => {
        deviceWidths(sizes, device, order).forEach(all.add, all);
        return all;
    }, new Set());

    needWidths = Array.from(needWidths);

    return filterSizes(needWidths, minScale);
};

/**
 * Filters a dimensions list, returning only dimensions that meet a threshold for downsizing.
 *
 * @param {Dimension[]} list - an array of dimension objects
 * @param {number} list[].w
 * @param {number} list[].h
 * @param {number} factor=0.8 - the maximum value for downscaling; i.e. 0.8 means any values that reduce an images pixels by less than 20% will be removed from the list 
 * @return {Dimension[]} - filtered array of dimensions
 */
const filterSizes = (list, factor=0.8) => {
    let sorted = [ ...list ].sort((a, b) => b - a); // sort large to small
    let filtered = [];
    for (let i = 0, j = 1; i < sorted.length;) {
        let a = sorted[i], b = sorted[j];
        if (a && !b) {
            filtered.push(a);
            break;
        }
        let scale1 = (b.w || b.width || b) / (a.w || a.width || a);
        let scale2 = (b.h || b.height || b) / (a.h || a.height || a);
        if (scale1 * scale2 < factor) {
            filtered.push(a);
            i = j;
            j = i + 1;
        } else {
            j++;
        }
    }
    return filtered;
};

/**
 * @typedef {Object} Size
 * @property {Object[]} Size.conditions - describes the media query conditions where the size applies
 * @property {string} Size.conditions[].mediaFeature - type of media query; usually 'min-width' or 'max-width'
 * @property {string} Size.conditions[].value - breakpoint where this applies
 * @property {string} Size.value - the object size when that query is valid
 */

// valid units for queries are:
// width/height: px, em, rem

/**
 * Parses the value of the img element's sizes attribute.
 *
 * @param {string} sizesQueryString
 * @return {Size[]} - an array of Size objects describing media query parameters
 */
var parseSizes = sizesQueryString => {
    const mediaParser = require('postcss-media-query-parser').default;
    return sizesQueryString
        .split(/\s*,\s*/)
        .map(descriptor => {
            let conditions = [];
            let mediaCondition, width = descriptor;
            let parsed = descriptor.match(/^(.*)\s+(\S+)$/);
            if (parsed)
                [, mediaCondition, width ] = parsed;
            if (mediaCondition) {
                if (/^\(.*\)$/.test(mediaCondition) && mediaCondition.indexOf('(', 1) > mediaCondition.indexOf(')'))
                    mediaCondition = mediaCondition.splice(1, -1);
                let parsed = mediaParser(mediaCondition).nodes[0];
                for (let node of parsed.nodes) {
                    if (node.type === 'media-feature-expression') {
                        conditions.push({
                            mediaFeature: node.nodes.find(n => n.type === 'media-feature').value,
                            value: node.nodes.find(n => n.type === 'value').value,
                        });
                    } else if (node.type === 'keyword' && node.value === 'and') {
                        continue; // TODO wouldn't be valid sizes attribute, but regardless this doesn't work
                        // maybe parse with cssValue here?
                    } else {
                        // not currently supporting other keywords, like not
                        break;
                    }
                }
            }
            return { conditions, width };
        });
};

module.exports = {
    devices,
    images,
    queries,
    widthsFromSizes,
    parseSizes,
    deviceWidths,
    filterSizes,
};
