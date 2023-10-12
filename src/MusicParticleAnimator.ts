import {applyVector, MovementVector, ParticleAnimator, ParticleManager, Vector} from "./Particle";
import type {Color, ICanvas} from 'pixi.js';
import {Application, Container, Graphics, Texture, TilingSprite} from "pixi.js";
import type {ZoomScale} from "d3";
import * as d3 from 'd3';
/*@ts-ignore*/
import * as TWEEN from '@tweenjs/tween.js';
import {InteractionManager} from "@pixi/interaction";
import {css, cx} from "@emotion/css";
import {isDef, isFunction, isUndef} from "@/utils/is.ts";
import Bg from '@/assets/img_texture.png';

const ease = (
    source: MovementVector, target: MovementVector,
    key: 'x' | 'y',
    over?: Function
) => {
    if (source[key] !== target[key]) over?.();
    Math.abs(source[key] - target[key]) < source.velocity[key]
        ? (over?.(), source[key] = target[key])
        : target[key] > source[key] ?
            source[key] += source.velocity[key] :
            (source[key] -= source.velocity[key]);
};

export  type MusicParticleRulerConfig = {
    ruler_line: {
        css: string,
    };
    ruler_dot: {
        css: string,
    }
}
export type MusicParticleScalerConfig = {
    css: string;
    top: {
        css?: string;
    },
    bottom: {
        css?: string;
    }
}
export type MusicParticleContainerConfig = {
    size: Partial<DOMRect>,
    padding: {
        left: number,
        right: number,
    },
    margin: {
        left: number,
        right: number,
    },
    scale: {
        x: number,
        y: number,
    },
    transform: VectorBasic & {
        k: number
    },
    gap: {
        height: number;
    },
    center: VectorBasic;
    background: Color;
    ruler: MusicParticleRulerConfig;
    scaler: MusicParticleScalerConfig;
    cursor: {
        x: number,
        y: number,
        scale: number,
        width: number,
        height: number,
        transform: VectorBasic & {
            k: number
        }
    }
};

export type MusicParticleConfig<T> = {
    /*当前排列粒子所在方向*/
    direction: 'up' | 'down' | 'both';
    checkDirection(particle: MusicParticle<T>): MusicParticleConfig<T>['direction'];
    up: {
        /*上边的粒子颜色*/
        color: Color;
    };
    down: {
        /*下边的粒子颜色*/
        color: Color;
    };
    mvps: {
        /*颜色以及尺寸*/
        color: Color;
    },
    card: {
        css: string
    },
    /*粒子移动的基速度*/
    /* 各方向的初始速度 */
    speed: VectorBasic | Vector;
    /*粒子放大的基速度*/
    scale_speed: VectorBasic;
    /*粒子初始放缩大小*/
    transform: VectorBasic & {
        k: number,
    };
    scale: {
        x: number,
        y: number,
    };
    margin: VectorBasic;
    sensitivity: number;
}
export type MusicParticleFooterConfig = {
    isOpen: boolean;
}

export class MusicParticle<T> extends ParticleAnimator {
    manager: MusicParticleManager<T> | null = null;
    shape: Graphics = new Graphics();
    container: Container = new Container();
    events: InteractionManager = new InteractionManager(this.shape);

    el!: Element;
    selected!: d3.Selection<Element, any, any, any>;
    /*@ts-ignore*/
    #state!: MusicParticleConfig<T> = {};

    constructor(state?: MusicParticleConfig<T>) {
        super();
        /*设置初始状态*/
        this.setState(state);
    }

    getState() {
        return this.#state;
    }

    setState(state?: Partial<MusicParticleConfig<T>>) {
        try {
            Object.assign(this.#state, state);
        } catch (err) {
            console.log(`err-->`, err);
        }
    }

    private async initShape() {
        const state = this.getState();
        /*绘制初始形状*/
        this.shape.beginFill(state[state.checkDirection?.(this) as 'up' | 'down'].color);
        this.shape.drawCircle(0, 0, 2);
        this.shape.endFill();
        this.shape.scale.set(state.scale.x, state.scale.y);
        this.shape.eventMode = 'dynamic';
        this.container.addChild(this.shape);
        this.manager?.root.stage.addChild(this.container);

//        if (this.data().is_mvp) {
//            this.shape.scale.set(state.scale.x + 2, state.scale.y + 2);
//        }
//
//        this.shape.on('pointertap', () => {
//            this.active();
//        });

//        this.shape.on('pointerleave', () => {
//        });
//        this.shape.on('pointerout', () => {
//            this.to.scale.apply({
//                x: state.scale.x * state.transform.k,
//                y: state.scale.y * state.transform.k,
//            });
//        });

        /*start*/

    }


    setManager(manager: MusicParticleManager<T>) {
        this.manager = manager;
        this.initShape();
        this.setupEase();
        return this;
    }

    timer: number = 0;

    triggerEaseOver() {
        setTimeout(() => {
            this.over_listeners.forEach((fn) => fn());
        });
    }

    setupEase() {
        this.ease();
    }

    over_listeners: Set<Function> = new Set<Function>();

    onEaseOver(fn: Function) {
        this.over_listeners.add(fn);
    }

    public toward() {
        if (this.animating) {
            /*复用上一批次的过程*/
            return this.animating;
        }
        /*执行新的过程*/
        this.animating = new Promise(
            (resolve) => {
                let unuseful = false;

                const over = () => {
                    if (unuseful) return;
                    unuseful = true;
                    /*抛出本次成果*/
                    resolve(this);
                    /*移除掉本批次的任务*/
                    this.animating = null;
                    this.over_listeners.delete(over);
                };
                this.onEaseOver(over);
            }
        );
        return this.animating;
    }


    ease() {
        const to = this.to;
        const setted = {
            x: false,
            y: false,
            scalex: false,
            scaley: false
        };


        if (!this.visible) {
            this.cur.x = this.to.x;
            this.cur.y = this.to.y;
            this.cur.scale = this.to.scale;
            this.cur.opacity = this.to.opacity;
            /*因为是不可见元素，所以在 render 的时候一见到为*/
            setted.x = true;
            setted.y = true;
            setted.scalex = true;
            setted.scaley = true;
        } else {
            ease(this.cur, to, 'x', () => setted.x = true);
            ease(this.cur, to, 'y', () => setted.y = true);
            ease(this.cur.scale, to.scale, 'x', () => setted.scalex = true);
            ease(this.cur.scale, to.scale, 'y', () => setted.scaley = true);
        }
        if (setted.x && setted.y && setted.scaley && setted.scalex) {
            this.triggerEaseOver();
        }
        requestAnimationFrame(this.ease.bind(this));
    }

    render() {
        this.shape.visible = this.need_render;
        this.shape.alpha = 1;
        applyVector(this.shape, this.cur.clone());
        applyVector(this.shape.scale, this.cur.scale.clone());
        this.updateEl();
        return this;
    }

    need_render: boolean = true;

    public appear() {
        const {min, max} = this.manager!.boundary;
        const random_dot = {
            x: [min.x - 10, max.x + 10][(Math.random() > 0.5) ? 0 : 1],
            y: [min.y - 10, max.y + 10][(Math.random() > 0.5) ? 0 : 1]
        };
        this.to.apply(random_dot);
        return this.toward();
    }

    _el: d3.Selection<any, any, any, any> | null | undefined = undefined;

    active() {
        if (this._el) return;
        const state = this.getState();
        this._el =
            this.manager!
                ?.selected!
                .datum(this)
                .append('div')
                .classed(cx(css`
                  position: absolute;
                  transform: translate(-50%, -50%);
                `), true)
                .classed(state.card.css, true)
                .style('top', d => `${d.cur.y}px`)
                .style('left', d => `${d.cur.x}px`)
                .on('click', function () {
                    const selected = d3.select(this);
                    if (!selected.classed('open')) {
                        selected?.classed('open', true)
                            .classed('close', false);
                        return open();
                    }
                    selected?.classed('open', false)
                        .classed('close', true);
                    return close();
                })
        ;

        const text = this._el!.append('span').classed(cx(
            'title',
        ), true);
        const truncate = (s: string, max_len: number, u: string = s.trim()) => u.length > max_len ? u.slice(0, max_len) + '...' : u;
        const open = () => {
            text.text((d) => {
                const data = d.data().data;
                return truncate(data?.news_title ?? '', 12);
            });
        };
        const close = () => {
            text.text((d) => {
                const data = d.data().data;
                return truncate(data?.news_title ?? '', 4);
            });
        };
        /*初始的时候关闭他*/
        close();
    }

    updateEl() {
        if (!this._el) return;
        if (this.manager?._events_target !== this) this.deactive();
        /*更新尺子的标签*/
        this._el?.style('top', d => `${d.cur.y}px`)
            .style('left', d => `${d.cur.x}px`);
    }

    deactive() {
        if (this._el?.classed('open')) return;
        this._el?.remove();
        this._el = undefined;
    }


    /*随机 数学函数 */
    rand_v(x: number, all_data: number) {

        return Math.random() * (1 + Math.abs((x - (all_data >> 1)) * Math.sin(x - (all_data >> 1))));
    };

    /*安排*/
    order_random_scale() {
        const state = this.getState();
        const data = this.data();

        return {
            x: state.scale.x * state.transform.k,
            y: state.scale.y * state.transform.k,
            velocity: {
                x: state.scale_speed.x * state.transform.k + this.rand_v(data.index as number, data.all_data as number),
                y: state.scale_speed.y * state.transform.k + this.rand_v(data.index as number, data.all_data as number),
            }
        };
    }

    order_pos() {
        const managerState = this.manager!?.getState();
        const state = this.getState();
        const data = this.data();
        const transform = managerState?.transform;
        return {
            x: managerState.center.x +
                managerState.padding.left +
                (data.row * state.margin.x) * transform.k + transform.x,
            y: (data.col - (data.col_all >> 1)) *
                (state.margin.y * transform.k)
                /*整个中心*/
                + (managerState.center.y) - managerState.gap.height
                + (data.col > (data.col_all >> 1) ? -(managerState.gap.height >> 1) : (-managerState.gap.height << 1)),

            velocity: {
                x: state.speed.x * state.transform.k + this.rand_v(data.index, data.all_data) || Math.random() * 10,
                y: state.speed.y * state.transform.k + this.rand_v(data.index, data.all_data) || Math.random() * 10,
            }
        };
    }
}


export class MusicParticleManager<T> extends ParticleManager {

    root: Application = new Application<ICanvas>(
        {
            backgroundColor: '#284852',
        }
    );
    events = new InteractionManager(this.root.renderer);
    container: Element | null = null;
    selected: d3.Selection<Element, any, any, any> | null = null;
    children: MusicParticle<T>[] = [];
    /*@ts0-ignore*/
    data: T | null = null;
    /*批量处理受作用的粒子*/

    /*备忘录记录者*/
    /*@ts-ignore*/
    state: MusicParticleContainerConfig = {};

    constructor(scale: d3.ScaleLinear<any, any>, parent_scale: d3.ScaleLinear<any, any>, state?: MusicParticleContainerConfig) {
        super();
        const animate = (t: number) => {
            TWEEN.update(t);
            requestAnimationFrame(animate);
        };
        /*绑定状态*/
        this.setState(state);
        this.scale.raw = scale.copy();
        this.scale.now = scale;

        this.parent_scale.raw = parent_scale.copy();
        this.parent_scale.now = parent_scale;

        /*for Debug*/
        /*@ts-ignore*/
        window.__PIXI_APP__ = this.root;
        animate(0);
    }

    /*保存状态*/
    setState(state?: MusicParticleContainerConfig): this {
        Object.assign(this.state, state);
        return this;
    }

    /*获取状态*/
    getState() {
        return this.state;
    }

    setChildrenState(state?: FnOrValue<MusicParticleConfig<T>>): this {
        if (isFunction(state)) {
            this.children.forEach((particle, index) => particle.setState(state(particle, index)));
            return this;
        }
        this.children.forEach((particle) => particle.setState(state));
        return this;
    }

    /**/
    setContainer(el: HTMLElement) {
        /*绑定 html 元素*/
        this.container = el;
        this.selected = d3.select(el as Element);

        /*绑定操作对象*/
        this.container.appendChild(this.root.view as HTMLCanvasElement);
        this.root.resizeTo = el;
        this.root.stage.sortableChildren = true;
        /*设置背景*/
        Texture.fromURL(Bg).then((res) => {
            const bg = new TilingSprite(res, this.root.screen.width, this.root.screen.height);
            this.root.stage.addChild(bg);
        });
        this.root.renderer.background.backgroundColor.value = this.state.background;
        window.addEventListener('resize', () => {
            this.children
                .map(particle => particle.shape)
                .forEach(shape => {
                    shape.updateTransform();
                });
        });
        /*animate*/
        this.root.ticker.add(() => {
            this.render();
        });
        /**/
        this.attachEvent();
        this.attachRuler();
        this.attachScale();
        return this;
    }

    attachEvent() {

        this.events.on('pointermove', (event) => {
            this.setEventsTarget(event.data.global);
        });
    }

    attachElement() {

        return this;
    }


    ruler: {
        selection: d3.Selection<any, any, any, any> | void | null;
        label: {
            selection: d3.Selection<any, any, any, any> | null | void;
        }
        dot: {
            selection: d3.Selection<any, any, any, any> | null | void;
        }
    } = {
        label: {
            selection: null
        },
        dot: {
            selection: null
        },
        selection: null
    };

    attachRuler() {
        const state = this.getState();
        const cursor = state.cursor;

        const ruler = this.ruler.selection = this.selected
            ?.datum(cursor)
            .append('div')
            .classed('ruler', true)
            .classed(cx(css`
              position: absolute;
              height: 100%;
              transform: translate(0, 0);
              pointer-events: none;
            `, state.ruler.ruler_line.css ?? ''), true)
            .style('display', 'none')
            .style('left', cursor => `${cursor.x}px`)
            .style('top', () => `${0}px`);


        this.ruler.dot.selection = ruler!.append('div')
            .classed('ruler_dot', true)
            .classed(cx(
                css`
                  background-size: contain;
                  left: 50%;
                  transform: translate(-54%, -50%);
                  border-radius: 50%;
                  pointer-events: none;
                `, state.ruler.ruler_dot.css ?? ''
            ), true)
            .style('position', 'absolute')
            .style('top', cursor => `${cursor.y + cursor.transform.y}px`)
            .style('width', cursor => (cursor.width * cursor.scale) + 'px')
            .style('height', cursor => (cursor.height * cursor.scale) + 'px');

        this.ruler.label.selection = ruler!.append('span')
            .classed('ruler-label', true)
            .classed(cx(css`
              position: absolute;
              color: #2c3e50;
              padding: 0 12px;
              background: #f2f2f2;
              border-radius: 0 8px 8px 0;
              white-space: nowrap;
            `, 'drop-shadow'), true);
        this.attachRulerEvent();
        /*bind*/
    }

    updateRulerLabel() {

    }

    attachRulerEvent() {
        const state = this.getState();
        const cursor = state.cursor;

        /*update ruler*/
        const update = () => {
            this.ruler.selection!
                .style('display', 'initial')
                .style('left', cursor => `${cursor.x + cursor.transform.x}px`);
            this.ruler.dot.selection!
                .style('top', cursor => `${cursor.y + cursor.transform.y}px`)
            ;
            this.ruler.label.selection!
                .text(cursor => {
                    const now = this.scale.now.invert(cursor.x + cursor.transform.x);
                    if (
                        now < this.scale.raw.domain()[0] ||
                        now > this.scale.raw.domain()[1]
                    ) return '';
                    /*@ts-ignore*/
                    return this.data!?.[Math.round(now) as number]?.time ?? '';
                })
            ;
        };
        this.selected!?.on('wheel', (event: WheelEvent) => {
            const direction = event.deltaY < 0 ? 1 : -1;
            const ampify = cursor.scale + (direction * Math.abs(event.deltaY / 1000));
            cursor.transform.k =
                direction === 1 ?
                    Math.min(3, ampify)
                    : Math.max(1, ampify)
            ;
            this.ruler.dot.selection!?.style('width', cursor => (cursor.width * cursor.scale * cursor.transform.k) + 'px')
                .style('height', cursor => (cursor.height * cursor.scale * cursor.transform.k) + 'px');
        }, {
            passive: true
        });

        this.selected?.on('mousemove', function (event) {
            const [x, y] = d3.pointer(event);
            Object.assign(cursor.transform, {x, y,});
            update();
        });
        this.onUpdateScale((_, {dx}) => {
            /*变化的时候*/
            this.ruler.selection!?.classed('scaling', true)
                .classed('zooming', dx === 0)
                .classed('left', dx > 0)
                .classed('right', dx < 0);
        });

    }

    /*@ts-ignore*/
    parent_scale: {
        raw: d3.ScaleLinear<any, any> | any,
        now: d3.ScaleLinear<any, any> | any,
    } = {};

    /*@ts-ignore*/
    scale: {
        raw: d3.ScaleLinear<any, any> | any,
        now: d3.ScaleLinear<any, any> | any,
    } = {};

    scaleView: {
        top: any;
        bottom: any;
        topDot: any;
        bottomDot: any;
    } = {
        top: null,
        topDot: null,
        bottomDot: null,
        bottom: null,
    };

    slider: {
        slider: d3.Selection<Element, any, any, any> | null,
        start: {
            slider: d3.Selection<Element, any, any, any> | null,
            value: any
        },
        end: {
            slider: d3.Selection<Element, any, any, any> | null,
            value: any
        },
        mid: {
            slider: d3.Selection<Element, any, any, any> | null,
            value: any
        }
    } = {
        slider: null,
        start: {
            slider: null,
            value: null
        },
        end: {
            slider: null,
            value: null
        },
        mid: {
            slider: null,
            value: null
        }
    };

    initSlider() {
        const that = this;
        Object.defineProperty(this.slider.start, 'value', {
            get() {
                return that.scale.now.domain()[0];
            },
            set() {
                return true;
            }
        });
        Object.defineProperty(this.slider.end, 'value', {
            get() {
                return that.scale.now.domain()[1];
            },
        });
    }

    attachScale() {
        this.initSlider();
        const state = this.getState();
        const template = this.selected!
            .append('div')
            .classed(cx(
                css`
                  position: absolute;
                  width: 100%;
                  height: 20px;
                `, 'drop-shadow'
            ), true)
            .classed(state.scaler.css ?? '', true)
        ;

        const bottom_drag = d3.drag();
        this.scaleView.bottom = template.clone()
            .classed(cx(css`
              bottom: 0;
            `), true)
            /*@ts-ignore*/
            .call(bottom_drag)
            .classed(state.scaler.bottom.css ?? '', true)
        ;

        this.scaleView.top = template.clone()
            .classed(cx(css`
              top: 0;
            `), true)
            .classed(state.scaler.top.css ?? '', true)
        ;


        const slider_container = this.scaleView.bottom!
            .classed(cx('bg-rgba(95, 121, 214, 0.1)'), true)
            .append('div')
            .classed('slider', true)
            .classed(cx(`absolute`, css`
              height: 100%;
              background: rgba(95, 121, 214, 0.3);
              cursor: pointer;
              border-radius: 2em;

              .slider_item {
                cursor: pointer;
                position: absolute;
                top: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: radial-gradient(50% 50% at 50% 50%, #476CCB 0%, rgba(85, 111, 205, 0.90) 61.98%, rgba(95, 121, 214, 0.00) 100%);
                z-index: 999;

                &.end_slider {
                  right: 0;
                }
              }
            `), true)
        ;

        const start_range_slider_drag = d3.drag().on('drag', (event) => {
            const dx = event.dx;
            const r_range = this.scale.now.range();
            const start = r_range[0] + dx;
            if (start < 0) return;
            const end = r_range[1];
            this.scale.now.domain([this.scale.now.invert(start), this.scale.now.invert(end)]);
            console.log(this.scale.now.domain);
            this.updateScale();
        });
        const start_range_slider = slider_container!
            .datum(this.slider.start)
            .append('div')
            .classed('slider_item start_slider', true)
            .call(start_range_slider_drag)
        ;
        /**/

//        const slider_container_drag = d3.drag().on('drag', (event) => {
//            const dx = event.dx;
//            const r_range = this.scale.now.range();
//            const start = r_range[0] + dx;
//            const end = r_range[1] + dx;
//            this.scale.now.domain([this.scale.now.invert(start), this.scale.now.invert(end)]);
//            this.updateScale();
//        });
//        slider_container!
//            .datum(this.slider)
//            .append('div')
//            .classed('slider_item mid_slider', true);

        const end_range_slider_drag =
            d3.drag().on('drag', (event) => {
                const dx = event.dx;
                const r_range = this.scale.now.range();
                const start = r_range[0];
                const end = r_range[1] + dx;
                const max_end = this.parent_scale.raw(this.parent_scale.now.domain()[1]);
                if (end > max_end || start > end) return;
                this.scale.now.domain([this.scale.now.invert(start), this.scale.now.invert(end)]);
                this.updateScale();
            });
        const end_range_slider = slider_container!
            .datum(this.slider.end)
            .append('div')
            .classed('slider_item end_slider', true)
            .call(end_range_slider_drag)
        ;

        slider_container
            .datum(this.slider)
            .style('width', (d: any) => Math.round(this.parent_scale.now(d.end.value) - this.parent_scale.now(d.start.value)) + 'px')
        ;
        this.slider.slider = slider_container;
        this.slider.start.slider = start_range_slider;
        this.slider.end.slider = end_range_slider;

        this.onUpdateScale(() => {
            const start = this.parent_scale.raw(this.slider.start.value);
            const end = this.parent_scale.raw(this.slider.end.value);
//            console.log(`start-->`, start)
//            console.log(`end-->`, start)
            (this.slider.slider as d3.Selection<Element, any, any, any>)?.style('left', () => start + 'px')
                .style('width', () => Math.round(end - start) + 'px')
            ;
        });
        this.updateScale();
    }

    scale_events: Set<Function> = new Set();

    onUpdateScale(fn: (
        scale: ZoomScale,
        d: {
            dx: number
        }) => any) {
        this.scale_events.add(fn);
    }

    updateScale() {
        /*换算像素变换，而非使用域变换*/
        const dx = this.scale.raw(this.scale.now.domain()[0]) - this.scale.raw.range()[0];
        const d = {
            dx
        };
        this.scale_events.forEach(fn => fn(this.scale.now, d));
        return this;
    }

    /*消失在外边去*/
    appear() {
        return Promise.all(this.children.map(
            (particle) => particle.appear()
        ));
    }

    _events_target: MusicParticle<any> | void = undefined;
    _delay: number = 200;
    _delay_timer: number | null = null;

    setEventsTarget(pointer: VectorBasic) {
        /*开始向外扩展查找*/
        /*查找依据为周围三到四列*/
        /*先简单计算一下!*/
        const containerState = this.getState();
        let closet: MusicParticle<any> | undefined = undefined;

        let closet_distance = Infinity;
        if (this._events_target?._el?.classed('open')) return;

        this.children
            .filter(child => {
                if (!child.visible) return false;
                const state = child.getState();
                const distance = child.cur.distance(pointer);
                const scale = d3.scaleLinear([1, 1.2],).domain([state.sensitivity, 0]);
                child.to.scale.apply({
                    x: state.scale.x * state.transform.k,
                    y: state.scale.y * state.transform.k,
                });
                child.cur.scale.velocity.apply({
                    x: state.scale_speed.x * state.transform.k,
                    y: state.scale_speed.y * state.transform.k,
                });

                if (distance > state.sensitivity) return;
                if (distance < closet_distance) {
                    closet = child;
                    closet_distance = distance;
                }
                const real = scale(distance);
                child.cur.scale.velocity.apply({
                    x: state.scale_speed.x * state.transform.k + 0.02 * Math.random(),
                    y: state.scale_speed.y * state.transform.k + 0.02 * Math.random(),
                });
                child.to.scale.apply({
                    x: (state.scale.x) * containerState.transform.k + real,
                    y: (state.scale.y) * containerState.transform.k + real,
                });
                return true;
            });


        if (isUndef(closet)) {
            /*如果没有最近元素，也就是远离了，但是没有最近数据*/
            if (!this._events_target?._el?.classed('open')) {
                return this._events_target?.deactive();
            }
            return;
        }
        if (this._delay_timer) clearTimeout(this._delay_timer);
        if (isDef<MusicParticle<any>>(this._events_target) && this._events_target !== closet) this._events_target.deactive();
        /*如果是另外一个对象*/
        this._delay_timer = setTimeout(() => {
            this._events_target = closet;
            closet?.active();
        }, this._delay);

    }
}
