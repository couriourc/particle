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
        delay(() => {
            _timeout = false;
            fn(...args);
        }, timeout)();
    };
//    return function calc(time = 0) {
//        /*如果小于，但是再次触发了这个*/
//        over_time += time;
//        if (over_time * 1e3 >= timeout) return () => {
//            if (over_time * 1e3 < timeout) return over_time = 0;
//            return fn();
//        };
//        return requestAnimationFrame(calc);
//    };
}

//const fn = throttle(() => {
//
//}, 1000);
/*should be onetime */
//fn();
//fn();
//fn();
/*ease */
//import 'animate.css'
