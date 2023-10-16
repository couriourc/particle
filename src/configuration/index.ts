const kt = {
    slider: [
        0, 0.07, 0.12, 0.2, 0.27, 0.35, 0.42, 0.46, 0.5, 0.55, 0.63, 0.72, 0.85,
        1,
    ],
    years: [
        -139e8, -46e8, -25e8, -542e6, -251e6, -65e6, -27e5, -5e4, -2500, 700,
        1400, 1750, 1950,
    ],
    jumps: [] as number[],
};
const Mt = {value1: 0, value2: 0, min: 1, max: 2e3, history: 0};
const gt = [1600, 2e3, -138e8, 2015, 1600, 2e3];

function P() {
    for (let e = 0, t = kt.slider.length; t > e; e++) {
        const a = Math.round(kt.slider[e] * Mt.max),
            o = kt.slider[e + 1] ? Math.round(kt.slider[e + 1] * Mt.max) : Mt.max,
            n = kt.years[e],
            i = kt.years[e + 1] ? kt.years[e + 1] : gt[3],
            r = i - n,
            s = o - a;
        kt.jumps[e] = Math.abs(r / s);
    }
};
P();
export const ktConfigure = kt;
