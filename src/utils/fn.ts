export function delay(fn: Function, timeout: number) {
    let over_time = 0;
    return function calc(time = 0) {
        over_time += time;
        if (over_time * 1e3 >= timeout) return fn();
        return requestAnimationFrame(calc);
    };
}
