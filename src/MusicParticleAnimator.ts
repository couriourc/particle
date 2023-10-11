import {
    applyVector,
    MovementVector,
    ParticleAnimator,
    ParticleManager,
    Vector
} from "./Particle";
import type {Color, ICanvas} from 'pixi.js';
import {Application, Graphics, Container, TilingSprite, Texture} from "pixi.js";
import * as d3 from 'd3';
/*@ts-ignore*/
import * as TWEEN from '@tweenjs/tween.js';
import {InteractionManager} from "@pixi/interaction";
import {css, cx} from "@emotion/css";
import {isFunction} from "@/utils/is.ts";
import Bg from '@/assets/img_texture.png';
import Move from '@/assets/move.png';
import type {ZoomScale} from "d3";
import {delay} from "@/utils/fn.ts";

const ease = (
    source: MovementVector, target: MovementVector,
    key: 'x' | 'y',
    over?: Function
) => Math.abs(source[key] - target[key]) < source.velocity[key]
    ? (over?.(), source[key] = target[key])
    : target[key] > source[key] ?
        source[key] += source.velocity[key] :
        (source[key] -= source.velocity[key]);


export  type MusicParticleRulerConfig = {
    ruler_line: {
        css: string,
    };
    ruler_dot: {
        css: string,
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
    background: Color;
    ruler: MusicParticleRulerConfig;

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

    setState(state?: MusicParticleConfig<T>) {
        Object.assign(this.#state, state ?? {});
    }

    private async initShape() {
        const state = this.getState();

        this.shape.beginFill(state[state.checkDirection?.(this) as 'up' | 'down'].color);
        this.shape.drawCircle(0, 0, 2);
        this.shape.endFill();
        this.shape.eventMode = 'dynamic';

        this.container.addChild(this.shape);
        this.manager?.root.stage.addChild(this.container);

        this.shape.on('pointertap', () => {
        });
//        this.shape.on('pointerover', () => {
//            this.manager!.setEventsTarget(this);
//            this.to.scale.x = 3;
//            this.to.scale.y = 3;
//            this.toward();
//        });
        this.shape.on('pointerleave', () => {
            this.to.scale.y = 1;
            this.to.scale.x = 1;
        });

    }


    setManager(manager: MusicParticleManager<T>) {
        this.manager = manager;
        this.initShape();

        return this;
    }

    timer: number = 0;

    public toward() {
        if (this.animating) {
            return this.animating;
        }
        if (!this.visible || !this.need_render) {
            this.cur.x = this.to.x;
            this.cur.y = this.to.y;
            this.cur.scale = this.to.scale;
            this.cur.opacity = this.to.opacity;
            this.render();
            this.animating = null;
            return Promise.resolve(this);
        }
        this.animating = new Promise(
            (resolve) => {
                let unuseful = false;
                this.ease(() => {
                    if (unuseful) return;
                    unuseful = true;
                    this.animating = null;
                    resolve(this);
                });
            }
        ).then(() => {
            return Promise.resolve(this);
        });
        return this.animating;
    }

    ease(all_over: Function = () => null) {
        const to = this.to;
        const setted = {
            x: false,
            y: false,
            scalex: false,
            scaley: false
        };
        ease(this.cur, to, 'x', () => {
            setted.x = true;
        });
        ease(this.cur, to, 'y', () => {
            setted.y = true;
        });
        ease(this.cur.scale, to.scale, 'x', () => {
            setted.scalex = true;

        });
        ease(this.cur.scale, to.scale, 'y', () => {
            setted.scaley = true;
        });

        if (setted.x && setted.y) {
            all_over();
        }
        requestAnimationFrame(this.ease.bind(this, all_over));
    }

    render() {
        this.shape.visible = this.need_render;
        this.shape.alpha = 0.8;
        applyVector(this.shape, {
            x: this.cur.x,
            y: this.cur.y,
        });
        applyVector(this.shape.scale, this.cur.scale.clone());
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

    public disappear() {
        /*出现在自身的位置*/
        this.need_render = true;
        this.render();
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
    children: MusicParticle<any>[] = [];
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


    attachRuler() {
        const state = this.getState();
        const cursor = {
            x: 0,
            y: 0,
            scale: 1,
            width: 12,
            height: 12,
        };


        const ruler = this.selected
            ?.datum(cursor)
            .append('div')
            .classed(cx(css`
              position: absolute;
              height: 100%;
              width: 2px;
              transform: translate(0, 0%);
              background: rgba(255, 255, 255, .2);
              border: solid 1px rgb(255, 0, 0);
              z-index: 100;
              pointer-events: none;
            `, state.ruler.ruler_line.css ?? ''), true)
            .style('display', 'none')
            .style('left', cursor => `${cursor.x}px`)
            .style('top', () => `${0}px`)
        ;

        const ruler_dot = ruler!.append('div')
            .classed(cx(
                'ruler_dot',
                css`
                  background-size: contain;
                  background: #222222 no-repeat center;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  pointer-events: none;
                  border: white solid 1px;

                  &.moving {
                    background-image: url(${Move});
                  }
                `, state.ruler.ruler_dot.css ?? ''
            ), true)
            .style('position', 'absolute')
            .style('top', cursor => `${cursor.y}px`)
            // .style('scale', cursor => cursor.scale)
            .style('width', cursor => (cursor.width * cursor.scale) + 'px')
            .style('height', cursor => (cursor.height * cursor.scale) + 'px')
        ;

        this.selected!?.on('wheel', (event: WheelEvent) => {
            const direction = event.deltaY < 0 ? 1 : -1;
            const ampify = cursor.scale + (direction * Math.abs(event.deltaY / 1000));
            cursor.scale =
                direction === 1 ?
                    Math.min(3, ampify)
                    : Math.max(1, ampify)
            ;
            ruler_dot
                .style('width', cursor => (cursor.width * cursor.scale) + 'px')
                .style('height', cursor => (cursor.height * cursor.scale) + 'px');
        });

        const ruler_label = ruler!.append('span')
            .classed(cx(css`
              position: absolute;
              color: #2c3e50;
              padding: 0 12px;
              background: #f2f2f2;
              border-radius: 0 8px 8px 0;
            `, 'drop-shadow'), true)
        ;

        /*update ruler*/
        const update = () => {
            ruler!
                .style('display', 'initial')
                .style('left', cursor => `${cursor.x}px`);
            ruler_dot!
                .style('top', cursor => `${cursor.y}px`)
            ;

            ruler_label!
                .text(Math.round(this.scale.now.invert(cursor.x)))
            ;
        };
        this.selected?.on('mousemove', function (event) {
            const [x, y] = d3.pointer(event);
            Object.assign(cursor, {
                x,
                y
            });
            update();
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
        const template = this.selected!
            .append('div')
            .classed(cx(
                css`
                  position: absolute;
                  width: 100%;
                  height: 20px;
                  background: #2c3e50;
                  z-index: 999;
                `
            ), true);

        const bottom_drag = d3.drag();
        this.scaleView.bottom = template.clone()
            .classed(cx(css`
              bottom: 0;
            `), true)
            /*@ts-ignore*/
            .call(bottom_drag);

        this.scaleView.top = template.clone()
            .classed(cx(css`
              top: 0;
              z-index: 12;
            `), true);


        const slider_container = this.scaleView.bottom!
            .classed(cx('bg-rgba(95, 121, 214, 0.1)'), true)
            .append('div')
            .classed('slider', true)
            .classed(cx(`absolute`, css`
              height: 100%;
              background: rgba(95, 121, 214, 0.3);
              cursor: pointer;
              z-index: 999;
              border-radius: 2em;

              .slider_item {
                cursor: pointer;
                position: absolute;
                top: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: radial-gradient(50% 50% at 50% 50%, #476CCB 0%, rgba(85, 111, 205, 0.90) 61.98%, rgba(95, 121, 214, 0.00) 100%);

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
            const end = r_range[1];
            this.scale.now.domain([this.scale.now.invert(start), this.scale.now.invert(end)]);
            this.updateScale();
        });
        const start_range_slider = slider_container!
            .datum(this.slider.start)
            .append('div')
            .classed('slider_item start_slider', true)
            .call(start_range_slider_drag)
        ;
        /**/

        const slider_container_drag = d3.drag().on('drag', (event) => {
            const dx = event.dx;
            const r_range = this.scale.now.range();
            const start = r_range[0] + dx;
            const end = r_range[1] + dx;
            this.scale.now.domain([this.scale.now.invert(start), this.scale.now.invert(end)]);
            this.updateScale();
        });
        const mid_range_slider = slider_container!
            .datum(this.slider)
            .append('div')
            .classed('slider_item mid_slider', true)
            .call(slider_container_drag);


        const end_range_slider_drag = d3.drag().on('drag', (event) => {
            const dx = event.dx;
            const r_range = this.scale.now.range();
            const start = r_range[0] + dx;
            const end = r_range[1];
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
            .style('width', (d) => Math.round(this.parent_scale.now(d.end.value) - this.parent_scale.now(d.start.value)) + 'px')
        ;
        this.slider.slider = slider_container;
        this.slider.start.slider = start_range_slider;
        this.slider.end.slider = end_range_slider;

        this.onUpdateScale(() => {
            const start = this.parent_scale.now(this.slider.start.value);
            const end = this.parent_scale.now(this.slider.end.value);

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
        const dx = this.scale.now.domain()[0] - this.scale.raw.domain()[0];
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

    _events_target = null;

    setEventsTarget(pointer: VectorBasic) {
        /*开始向外扩展查找*/
        /*查找依据为周围三到四列*/
        /*先简单计算一下!*/
        const containerState = this.getState();
        let count = 0;

        this.children
            .filter(child => child.visible)
            .filter(child => {
                const state = child.getState();
                const distance = child.cur.distance(pointer);
                const scale = d3.scaleLinear([1, 1.2],).domain([state.sensitivity, 0]);
                child.to.scale.apply({
                    x: state.scale.x * containerState.transform.k,
                    y: state.scale.y * containerState.transform.k,
                });
                if (distance > state.sensitivity) return;
                const real = scale(distance);
                count++;

                child.cur.scale.velocity.apply({
                    x: state.scale_speed.x + Math.random() * 0.2,
                    y: state.scale_speed.y + Math.random() * 0.2,
                });
                child.to.scale.apply({
                    x: (state.scale.x) * containerState.transform.k + real,
                    y: (state.scale.y) * containerState.transform.k + real,
                });
                return true;
            });


    }
}
