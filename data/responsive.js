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

module.exports = {
    devices: devices,
    images: images,
    queries: queries
};
