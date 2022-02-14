export const capitalize = (v: string) => v[0].toUpperCase() + v.substring(1, v.length);

export const removeScientificFormat = (x: number) => {
    if (!x) { return x }
    let v: any = x;
    if (Math.abs(v) < 1.0) {
        var e = parseInt(v.toString().split('e-')[1]);
        if (e) {
            v *= Math.pow(10, e - 1);
            v = '0.' + (new Array(e)).join('0') + v.toString().substring(2);
        }
    } else {
        var e = parseInt(v.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            v /= Math.pow(10, e);
            v += (new Array(e + 1)).join('0');
        }
    }
    return v;
}

export const roundFloorString = (v: number, precision = 8) => {
    return toFixed(v, precision);
}

function toFixed(num: number, fixed = 2) {
    try {
        var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return (removeScientificFormat(num).toString() || '0').match(re)[0];
    } catch (e) {
        console.log(e);
    }
    return num.toFixed(fixed)
}

export function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, ...sources): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}