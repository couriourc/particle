type Constructor<T = {}> = new (...args: any[]) => T;
function Mixin<T>(...args: T[]) {
    const mediator = new Function();
    Object.assign(mediator.prototype, ...args);
}
