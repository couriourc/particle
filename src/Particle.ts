/*向量基类*/


import {isArray, isFunction, isNumber} from "@/utils/is.ts";

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
            [this.x, 0],
            [0, this.y]
        ];
    }


    distance(other?: VectorBasic) {
        return this.toArray(other).reduce(((pre, now) => pre ** 2 + now ** 2), 0) ** 0.5;
    }

    angle(other?: Vector): number {
        return Math.acos(this.distance(other) / (this.distance() * other.distance()));
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
}

export class MovementVector extends Vector {
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    friction: number = 1;
}

export type ShapeBoundaryRecord = Record<'min' | 'max', Vector>;

export class Shape extends MovementVector {

    isInRange(min: Vector, max: Vector): boolean {
        return this.x > min.x &&
            this.y > min.x &&
            this.x < max.x &&
            this.y < max.y;
    }
}

export class ParticleMutableProperties extends Shape {
    scale: number = 1;
    opacity: number = 1;

    toStyle(): MutableStyledMap {
        return {
            transform: `translate(${this.x},${this.y}) scale(${this.scale})`,
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
    /*粒子状态*/

    id: string = "";
    status: "enter" | "update" | "remove" = "enter";

    animating: (Promise<Particle> | null) = null;

    load(): Particle {
        return this;
    }

    /**/
    async toward(): Promise<Particle> {
        return this;
    }

    render(): Particle | Promise<Particle> {
        return this;
    }

    tick(time: void | number): boolean {
        return false;
    }

    toString() {
        const styledMap = this.cur.toStyle();
        return Object.keys(styledMap)
            .reduce((pre, old) => pre + `[${old}]:${styledMap[old as keyof MutableStyledMap]};`, '');
    }

    $delay: number = 0;
    $duration: number = 1000;

    delay(delay: number) {
        this.$delay = delay;
        return this;
    }

    duration<T extends number>(duration: T) {
        if (!isNumber(duration)) return this.$duration;
        this.$duration = duration;
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
        setTimeout(() => {
            this.$listeners[typename].forEach(
                fn => fn(...args)
            );
        });
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
}

export class ParticleAnimator extends Particle {

    public tick(time: void | number): boolean | undefined {
        this.cur.velocity.add(this.cur.acceleration);
        this.cur.add(this.cur.velocity);
        return false;
    }
}

export class ParticleManager {
    /*根元素*/
    root: any;
    /*子节点信息*/
    children: Particle[] = [];
    _children_set: Set<Particle['id']> = new Set();

    _id: string | ((any) => any) = 'id';

    /*加载*/
    load(): ParticleManager {
        this.children.forEach(particle => particle.load());
        return this;
    }

    /*渲染子节点*/
    render(): Promise<Particle[]> {
        return Promise.all(
            this.children.map(particle => particle.render())
        );
    };

    /*向着各自的 to 移动*/
    toward(): Promise<Particle[]> {

        return Promise.all(this.children.map(particle => particle.toward()));
    };

    /*批量设置运动时间*/
    duration(fnOrVal: FnOrValue<number>): ParticleManager {
        this.children.forEach((particle, index) => particle.duration(
                isFunction(fnOrVal)
                    ? (fnOrVal as Function)(particle, index)
                    : fnOrVal as number
            )
        );
        return this;
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
        const sets = this._children_set;
        const particles = (isArray(particle) ? particle : [particle]) as Particle[];
        particles.forEach(
            particle => {
                particle.setManager(this);
                if (sets.has(particle[
                    isFunction(this._id) ? this._id(particle) : this._id
                    ])) {
                    particle.status = 'update';
                    particle.emit('life:update');
                } else {
                    particle.status = 'enter';
                    particle.emit('life:enter');
                    this.children.push(particle);
                }
            }
        );
        return this;
    }

    /*设置运动的边界值*/
    boundary: ShapeBoundaryRecord = {
        min: new Vector(),
        max: new Vector(),
    };

    /*按照条件过滤部分节点*/
    filter(): ParticleManager {
        return this;
    }

    /*获取处于边界内的节点*/
    getIncludedParticle(): Particle[] {
        return this.children.filter(
            particle => particle.cur.isInRange(this.boundary.min, this.boundary.max)
        );
    }

    constructor(initial?: Partial<ParticleManager>) {
        Object.assign(this, initial ?? {});
    }

    clone() {
        return new ParticleManager(this);
    }
}



