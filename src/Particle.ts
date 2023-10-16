/*向量基类*/


import {isArray, isFunction, isNumber, isUndef} from "@/utils/is.ts";

export function applyVector(target: VectorBasic, source: VectorBasic) {
    Object.keys(source).forEach((key) => {
        target[key as keyof VectorBasic] = source[key as keyof VectorBasic];
    });
}

export class ThemeProvider<T> {
    state: T;

    constructor(state: T) {
        this.state = state;
    }

    getState() {

    }

    setState() {

    }
}

export class Vector implements VectorBasic {
    x: number = 0;
    y: number = 0;

    apply(other: VectorBasic) {
        Object.assign(this, {
            x: other.x,
            y: other.y
        });
        return this;
    }

    applyScale(n: number) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    add(other: VectorBasic) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    minus(other: VectorBasic) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    multiply(other: VectorBasic) {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    }

    divide(other: VectorBasic) {
        this.x /= other.x;
        this.y /= other.y;
        return this;
    }

    round(other: VectorBasic) {
        this.x %= other.x;
        this.y %= other.y;
        return this;
    }


    pow(n: number) {
        this.x = this.x ** n;
        this.y = this.y ** n;
        return this;
    }

    rotate(rad: number) {
        const x = this.x;
        const y = this.y;

        this.x = x * Math.cos(rad) - y * Math.sin(rad);
        this.y = x * Math.sin(rad) + y * Math.cos(rad);
        return this;
    }

    toArray(other?: VectorBasic): VectorBasic[keyof VectorBasic][] {
        return [this.x - (other?.x ?? 0), this.y - (other?.y ?? 0)];
    }

    toMatrix() {
        return [
            [this.x],
            [this.y],
        ];
    }


    distance(other?: VectorBasic) {
        return this.toArray(other).reduce(((pre, now) => pre + now ** 2), 0) ** 0.5;
    }

    angle(other?: Vector): number {
        return Math.acos(this.distance(other) / (this.distance() * (other?.distance() ?? 1)));
    }

    direct(other?: VectorBasic) {
        const check = (val: number) => val > 0 ? 1 : val << 31;
        return new Vector({
            x: check(this.x - (other?.x ?? 0)),
            y: check(this.y - (other?.y ?? 0))
        });
    }


    constructor(initial?: Partial<Vector>) {
        Object.assign(this, initial ?? {});
    }

    clone() {
        return new Vector(this);
    }

    equal(other: VectorBasic) {
        return this.x === other.x && this.y === other.y;
    }

    static isInRange(val: VectorBasic, min: VectorBasic, max: VectorBasic) {
        return val.x >= min.x && val.x <= max.x && val.y >= min.y && val.y <= max.y;
    }
}


export class MovementVector extends Vector {
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    friction: number = 1;

    /**
     * @param to {VectorBasic} 需要变动到的地方
     * @param over {Function} 需要变动到的地方
     * */
    to(to: VectorBasic, next: Function, over: Function) {
        ([
            'x',
            'y'
        ] as ('x' | 'y')[]).forEach(
            (attr: 'x' | 'y') => {
                Math.abs(this[attr] - to[attr]) < Math.abs(this.velocity[attr])
                    ? this[attr] = to[attr] :
                    this[attr] > to[attr]
                        ? this[attr] -= this.velocity[attr] :
                        this[attr] += this.velocity[attr]
                ;
            }
        );
        /*获得插值信息*/
        if (this.x === to.x && this.y === to.y) {
            over();
        } else {
            next();
        }
        return this;
    }
}

export type ShapeBoundaryRecord = Record<'min' | 'max', Vector>;

export class Shape extends MovementVector {
    isInRange(boundary: ShapeBoundaryRecord): boolean {
        return this.x > boundary.min.x &&
            this.x < boundary.max.x &&
            this.y > boundary.min.y &&
            this.y < boundary.max.y;
    }
}

export class ParticleMutableProperties extends Shape {


    scale: MovementVector = new MovementVector({
        x: 1, y: 1
    });

    opacity: number = 1;

    toStyle(): MutableStyledMap {
        return {
            transform: `translate(${this.x},${this.y}) scaleX(${this.scale.x}) scaleY(${this.scale.y})`,
            opacity: `${this.opacity}`,
        };
    }

    constructor(initial?: ParticleMutableProperties) {
        super();
        Object.assign(this, initial ?? {});
    }

    clone() {
        return new ParticleMutableProperties(this);
    }

}

type ParticleHookName = `life:${Particle['status']}`;


export class Particle {
    /*管理者*/
    manager: ParticleManager | null = null;
    /*从哪个状态开始*/
    from: ParticleMutableProperties = new ParticleMutableProperties();
    /*当前所处的状态*/
    cur: ParticleMutableProperties = new ParticleMutableProperties();
    /*去到哪个状态*/
    to: ParticleMutableProperties = new ParticleMutableProperties();

    _data: any;

    data(data?: any) {
        if (isUndef(data)) return this._data;
        this._data = data;
        return this;
    }

    /*粒子状态*/
    get visible(): boolean {
        const boundary = this.manager?.boundary as ShapeBoundaryRecord ?? undefined;
        return this.cur.isInRange(boundary);
    }

    get willVisible() {
        const boundary = this.manager?.boundary as ShapeBoundaryRecord ?? undefined;
        return this.to.isInRange(boundary);
    }

    id: string = "";
    status: "enter" | "update" | "remove" = "enter";


    animating: (Promise<this> | null) = null;

    is_stabled() {
        return this.to.equal(this.cur);
    }

    load(): this {
        return this;
    }

    /**/
    async toward(): Promise<this> {
        return this;
    }

    render(): this {
        return this;
    }


    toString() {
        const styledMap = this.cur.toStyle();
        return Object.keys(styledMap)
            .reduce((pre, old) => pre + `[${old}]:${styledMap[old as keyof MutableStyledMap]};`, '');
    }

    $delay: number = 0;

    delay(delay: number) {
        this.$delay = delay;
        return this;
    }


    setManager(manager: ParticleManager) {
        this.manager = manager;
        return this;
    }


    /*生命周期*/

    $listeners: Record<ParticleHookName, Set<Function>> = {
        "life:enter": new Set(),
        "life:update": new Set(),
        "life:remove": new Set()
    };

    emit(typename: ParticleHookName, ...args: any[]) {
        // setTimeout(() => {
        this.$listeners[typename].forEach(
            fn => fn(...args)
        );
        // });
        return this;
    }

    on(typename: ParticleHookName, fn: Function) {
        this.$listeners[typename].add(fn);
        return this;
    }

    onParticleUpdate(fn: Function) {
        return this.on('life:update', fn);
    }

    onParticleEnter(fn: Function) {
        return this.on('life:enter', fn);
    }

    onParticleRemove(fn: Function) {
        return this.on('life:remove', fn);
    }

    remove() {
        const managerChildren = this.manager?.children;
        if (!managerChildren) return false;
        const index = this.manager?.children.findIndex(_child => _child === this);
        if (isUndef(index)) return false;
        managerChildren.splice(index as number, 1);
        return true;
    }
}

export class ParticleAnimator extends Particle {
    constructor(initial?: ParticleAnimator) {
        super();
        Object.assign(initial ?? {});
    }

    clone(): ThisType<any> {
        return new ParticleAnimator(this);
    }
}

export class ParticleManager {
    /*根元素*/
    root: any;
    /*子节点信息*/
    children: Particle[] = [];
    _children_map: Map<Particle['id'], Particle> = new Map();

    _id: string | ((data: any) => any) = 'id';

    animating: Promise<this['children']> | null = null;

    /*加载*/
    load(): ParticleManager {
        this.children.forEach(particle => particle.load());
        return this;
    }

    /*渲染子节点*/
    render() {
        this.children
            .forEach(particle => particle.render());
    };


    /*向着各自的 to 移动*/
    toward(): Promise<this['children']> {
        if (this.animating) return this.animating;
        this.animating = Promise.all(
            this.children
                .map(particle => particle.toward()))
            .then(res => {
                this.animating = null;
                return Promise.resolve(res);
            });
        return this.animating;
    };

    /*批量设置延迟时间*/
    delay(fnOrVal: FnOrValue<number>): ParticleManager {
        this.children.forEach((particle, index) => particle.delay(
                isFunction(fnOrVal)
                    ? (fnOrVal as Function)(particle, index)
                    : fnOrVal as number
            )
        );
        return this;
    };

    /*添加新的节点*/
    appendChild(particle: Particle | Particle[]) {
        const map = this._children_map;
        const particles = (isArray(particle) ? particle : [particle]) as Particle[];
        particles.forEach(
            (particle, index) => {
                // console.log(map.has(particle[isFunction(this._id) ? (this._id)(particle) as string : this._id as string]));
                /*@ts-ignore*/
                const identity = particle[isFunction(this._id) ? (this._id)(particle) as string : this._id as string];
                if (map.has(identity)) {
                    const _particle = map.get(identity) as Particle;
                    _particle.status = 'update';
                    _particle.emit('life:update');
                    delete particles[index];
                } else {
                    particle.setManager(this);
                    particle.status = 'enter';
                    particle.emit('life:enter');
                    this.children.push(particle);
                    this._children_map.set(particle.id, particle);
                }
            }
        );
        return this;
    }

    removeChild(particles: Particle | Particle[]) {
        if (isArray(particles)) {
            (particles as Particle[]).forEach(particle => {
                this.removeChild(particle);
            });
            return this;
        }

        return this.removeChildById((particles as Particle).id);
    }

    removeChildById(ids: string[] | string) {
        if (ids instanceof Array) {
            ids.forEach(id => this.removeChildById(id));
            return this;
        }
        const id: string = ids;
        const child = this._children_map.get(id);
        if (!child) return this;
        this._children_map.delete(ids as string);
        child.status = 'remove';
        child.emit('life:remove');
        return this;
    }

    /*设置运动的边界值*/
    boundary: ShapeBoundaryRecord = {
        min: new Vector(),
        max: new Vector(),
    };

    getRandomDotAtBoundary() {
        const {min, max} = this.boundary;
        return {
            x: Math.round(max.x - Math.random() * (max.x - min.x)),
            y: Math.round(max.y - Math.random() * (max.y - min.y)),
        };
    }

    constructor(initial?: Partial<ParticleManager>) {
        Object.assign(this, initial ?? {});
    }

    clone() {
        return new ParticleManager(this);
    }

}



