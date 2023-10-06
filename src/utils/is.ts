

function is(source: any) {
    return Object.prototype.toString.call(source)
        .replace(/\[object (.*)]/, '$1')
        .toLowerCase();
}

export function isUndef(target: any) {
    return is(target) === is(undefined);
}

export function isDef(target: any): boolean {
    return !isUndef(target);
}

export function isNumber(target: any): boolean {
    return is(target) === is(Number);
}

export function isFunction(target: any): boolean {
    return is(target) === is(new Function());
}

export function isArray(target: any): boolean {
    return is(target) === is(new Array(0));
}
