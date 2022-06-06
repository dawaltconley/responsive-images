const devices: Device[] = require('./default-devices.json');

/**
 * @constant {RegExp} - used for parsing a CSS value
 */
const valueRegex: RegExp = /([\d.]+)(\D*)/;

/**
 * Parses a string as a value with an optional unit.
 * @param {string} v - string to parse
 * @return {string[]|null} - [ value, unit ]
 */
const cssValue = (v: string): [number, string] => {
    let value: string = v, unit: string = '';
    let match = v.match(valueRegex);
    if (match)
      [, value, unit] = match
    return [ Number(value), unit ];
};

/**
 * @typedef {Object} Size
 * @property {Object[]} Size.conditions - 
 * @property {string} Size.conditions[].mediaFeature - type of media query; usually 'min-width' or 'max-width'
 * @property {string} Size.conditions[].value - breakpoint where this applies
 * @property {string} Size.width - the object size when that query is valid
 */

interface MediaCondition {
  mediaFeature: string,
  value: string,
}

interface Size {
  conditions: MediaCondition[],
  width: string
}

interface Dimension {
  w: number,
  h: number,
}

const isDimension = (object: any): object is Dimension =>
  object && typeof object.w === 'number' && typeof object.h ==='number' && object.dppx === undefined

const isDimensionArray = (array: any[]): array is Dimension[] => {
  for (const item of array)
    if (!isDimension(item))
      return false
  return true
}

interface Device extends Dimension {
  dppx: number[],
  flip: boolean
}

// type Dimension = number

type Order = 'min' | 'max'

/**
 * Takes a 2d array representation of the img sizes attribute and a specific device,
 * returning the image widths needed to support that device.
 *
 * @param {Size[]} sizes
 * @param {Device} device - object representing an expected device
 * @param {string} order - whether the widths should be interpreted as 'min' or 'max'
 * @return {Set} unique widths that will need to be produced for the given device
 */
const deviceWidths = (sizes: Size[], device: Device/* , order: Order */): Set<number> => {
    let imgWidth: string;

    whichSize:
    for (let { conditions, width } of sizes) {
        imgWidth = width;
        for (let { mediaFeature, value: valueString } of conditions) {
            let [ value, unit ]: [number, string] = cssValue(valueString)
            if (unit !== 'px')
              throw new Error(`Invalid query unit ${unit}: only px is supported`)
            let match: boolean = mediaFeature === 'min-width' && device.w >= value
                || mediaFeature === 'max-width' && device.w <= value
                || mediaFeature === 'min-height' && device.h >= value
                || mediaFeature === 'max-height' && device.h <= value;
            if (!match)
                continue whichSize;
        }
        break whichSize;
    }

    let needWidths: Set<number> = new Set();

    device.dppx.forEach((dppx: number) => {
        let [ scaledWidth, unit='px' ]: [number, string] = cssValue(imgWidth);
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
 * @param {number} opt.minScale - minimum percentage by which to downscale the image (passed as 'factor' to filterSizes)
 * @return {Dimension[]}
 */

const widthsFromSizes = (sizesQueryString: string, opt: {
  order?: Order
  minScale?: number
} = {}): number[] => {
    let {
        order,
        minScale
    } = opt;
    let sizes = parseSizes(sizesQueryString)

    let needWidths: Set<number> = devices.reduce((all, device) => {
        deviceWidths(sizes, device).forEach(n => all.add(n), all);
        return all;
    }, new Set<number>());

    let widthsArray: number[] = Array.from(needWidths);

    return filterSizes(widthsArray, minScale);
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
function filterSizes(list: number[], factor?: number): number[];
function filterSizes(list: Dimension[], factor?: number): Dimension[];
function filterSizes(list: number[] | Dimension[], factor: number = 0.8): number[] | Dimension[] {
    // sort list from large to small
    let sorted = isDimensionArray(list)
      ? [ ...list ].sort((a, b) => b.w * b.h - a.w * a.h) 
      : [ ...list ].sort((a, b) => b - a); 
    let filtered: any[] = [];
    for (let i = 0, j = 1; i < sorted.length;) {
        let a = sorted[i], b = sorted[j];
        if (a && !b) {
            filtered.push(a);
            break;
        }
        let scale1 = (isDimension(b) ? b.w : b) / (isDimension(a) ? a.w : a);
        let scale2 = (isDimension(b) ? b.h : b) / (isDimension(a) ? a.h : a);
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

interface MediaQueryNode {
  type: 'media-query-list'
    | 'media-query'
    | 'media-feature-expression'
    | 'media-feature'
    | 'colon'
    | 'value'
    | 'media-type'
    | 'keyword',
  after: string,
  before: string,
  value: string,
  sourceIndex: number,
  parent?: MediaQueryNode,
  nodes: MediaQueryNode[]
}

// valid units for queries are:
// width/height: px, em, rem

/**
 * Parses the value of the img element's sizes attribute.
 *
 * @param {string} sizesQueryString
 * @return {Size[]} - an array of Size objects describing media query parameters
 */
var parseSizes = (sizesQueryString: string): Size[] => {
    const mediaParser = require('postcss-media-query-parser').default;
    return sizesQueryString
        .split(/\s*,\s*/)
        .map((descriptor: string) => {
            let conditions: MediaCondition[] = [];
            let parsed = descriptor.match(/^(.*)\s+(\S+)$/);
            if (!parsed)
              return { conditions, width: descriptor };

            let [, mediaCondition, width ]: string[] = parsed;
            if (mediaCondition) {
                if (/^\(.*\)$/.test(mediaCondition) && mediaCondition.indexOf('(', 1) > mediaCondition.indexOf(')')) {
                  // not clear what this condition is supposed to do
                  // seems like it wants to remove enclosing parenthesis
                  // but it never seems to fire
                  // probably wants to fire on ((min-width: 49em) and (max-width: 55px))
                  // but instead fires on (min-width: 49em) and (max-width: 55px)
                  mediaCondition = mediaCondition.slice(1, -1);
                }
                let parsed = mediaParser(mediaCondition).nodes[0] as MediaQueryNode;
                for (let node of parsed.nodes) {
                    if (node.type === 'media-feature-expression') {
                        conditions.push({
                            mediaFeature: node.nodes.find(n => n.type === 'media-feature')!.value,
                            value: node.nodes.find(n => n.type === 'value')!.value,
                        });
                        // let mediaFeature = node.nodes.find(n => n.type === 'media-feature')
                        // let value = node.nodes.find(n => n.type === 'value')
                        // if (!mediaFeature || !value)
                        //   throw new Error(`Bad media-feature-expression: ${node}`)
                        // conditions.push({
                        //     mediaFeature: mediaFeature.value,
                        //     value: value.value,
                        // });
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
    widthsFromSizes,
    parseSizes,
    deviceWidths,
    filterSizes,
};
