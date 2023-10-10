function is(source: any) {
    return Object.prototype.toString.call(source)
        .replace(/\[object (.*)]/, '$1')
        .toLowerCase();
}

export function isUndef(target: any): target is undefined {
    return is(target) === is(undefined);
}

export function isDef(target: any): target is {} {
    return !isUndef(target);
}

export function isNumber(target: any): target is number {
    return is(target) === is(Number);
}

export function isFunction(target: any): target is Function {
    return is(target) === is(new Function());
}

export function isArray(target: any): target is [] {
    return is(target) === is(new Array(0));
}
export function isString(target: any): target is string {
    return is(target) === is('');
}
export function isBoolean(target: any): target is string {
    return is(target) === is(true);
}
