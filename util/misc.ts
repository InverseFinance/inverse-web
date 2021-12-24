export const capitalize = (v: string) => v[0].toUpperCase() + v.substring(1, v.length);

export const removeScientificFormat = (x: number) => {
    if(!x) { return x }
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