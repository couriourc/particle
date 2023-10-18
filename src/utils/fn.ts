export function delay(fn: Function, timeout: number) {
    let over_time = 0;
    return function calc(time = 0) {
        over_time += time;
        if (over_time * 1e3 >= timeout) return fn();
        return requestAnimationFrame(calc);
    };
}

export function throttle(fn: Function, timeout: number) {

    let _timeout: boolean = false;
    return (...args) => {
        if (_timeout) return;
        _timeout = true;
        return delay(() => {
            _timeout = false;
            fn(...args);
        }, timeout)();
    };
}

