import {applyVector, MovementVector, ParticleAnimator, ParticleManager, Vector} from "./Particle";
import type {ICanvas} from 'pixi.js';
import {Application, Filter, Sprite, Texture,} from "pixi.js";
import {delay} from "./utils/fn";
import * as d3 from 'd3';
import * as TWEEN from '@tweenjs/tween.js';
import {InteractionManager} from "@pixi/interaction";
import ParticleGif from './assets/particle.gif';
import {css, cx} from "@emotion/css";
import {isUndef} from "@/utils/is.ts";
import {computed} from "vue";
import {Tween} from "@tweenjs/tween.js";

const ease = (
    source: MovementVector, target: MovementVector,
    key: 'x' | 'y',
    over: Function
) => Math.abs(source[key] - target[key]) < source.velocity[key]
    ? (over(), source[key] = target[key])
    : target[key] > source[key] ?
        source[key] += source.velocity[key] :
        (source[key] -= source.velocity[key]);

export class MusicParticle extends ParticleAnimator {
    manager: MusicParticleManager | null = null;
    shape: Sprite = new Sprite();
    events: InteractionManager = new InteractionManager(this.shape);
    el: Element;
    selected: d3.Selection<Element, any, any, any>;

    sensitivity: number = 40;

    onHover() {
        console.log('hover');
    }

    private async initShape() {
        const app = this.manager!.root;
        const events = this.manager!.events;
        const st = Texture.fromURL(ParticleGif);
        const graphics = this.shape;
        graphics.texture = await st;
        app.stage.addChild(graphics);

        graphics.anchor.set(.5);
        graphics.interactive = true;
        graphics.buttonMode = true;

        graphics.cursor = 'grab';


        const xScale = d3.scaleLinear([this.sensitivity, 0], [1, 1.8]);

        graphics.addEventListener('click', (event) => {
            console.log(event);
        });
        events.on('mousemove', (event) => {
            if (!this.visible) return;
            const x = event.data.global.x;
            const y = event.data.global.y;
            const dx = Math.abs(x - this.cur.x);
            const dy = Math.abs(y - this.cur.y);
            /*增长大小*/
            const d = (dx ** 2 + dy ** 2) ** 0.5;
            if (d < this.sensitivity) {
                /*只做应用，不做篡改*/
                this.to.scale.apply(this.from.scale.clone().applyScale(xScale(d)));
                const scale = 0.2 * Math.random();
                this.cur.scale.velocity.apply({
                    x: scale,
                    y: scale,
                });
                this.manager?.setEventsTarget(this, {dx, dy});
            } else {
                /*只做应用，不做篡改*/
                this.to.scale.apply(this.from.scale);
                this.manager?.cancelTarget(this);
            }
            this.toward();
        });
    }


    setManager(manager: MusicParticleManager) {
        this.manager = manager;
        this.initShape();
        return this;
    }

    public toward() {
        if (this.animating) {
            return this.animating;
        }
        if (!this.visible) {
            this.cur.x = this.to.x;
            this.cur.y = this.to.y;
            this.cur.scale = this.to.scale;
            this.cur.opacity = this.to.opacity;
            this.render();
            return Promise.resolve(this);
        }

        this.animating = new Promise(
            (resolve) => {
                const animate = () => {
                    const to = this.to;
                    const cur = this.cur;
                    let place = 0b00000; // x y scalex scaley
                    ease(cur, to, 'x', () => place |= 0b10000);
                    ease(cur, to, 'y', () => place |= 0b01000);
                    ease(cur.scale, to.scale, 'x', () => place |= 0b00100);
                    ease(cur.scale, to.scale, 'y', () => place |= 0b00010);

                    this.render();

                    if (place === 0b1111) {
                        this.animating = null;
                        resolve(this);
                        return;
                    }
                    return requestAnimationFrame(animate);
                };
                delay(animate.bind(this), this.$delay)();
            }
        );
        return this.animating;
    }

    render() {
        this.shape.visible = this.visible;
        this.shape.alpha = 0.8;
        applyVector(this.shape, this.cur);
        applyVector(this.shape.scale, this.cur.scale);
        this.selected?.datum(this)
            .attr('style', d => `position:absolute;top:${d.cur.y}px;left:${d.cur.x}px;`);

        return this;
    }

    remove() {
        this.manager?.root.stage.removeChild(this.shape);
        return super.remove();
    }

}

export class MusicParticleManager extends ParticleManager {
    root: Application = new Application<ICanvas>(
        {
            backgroundColor: '#FFF',
            antialias: true,
            resolution: devicePixelRatio,
            powerPreference: 'high-performance'
        }
    );
    events = new InteractionManager(this.root.renderer);
    container: Element | null = null;
    selected: d3.Selection<Element, any, any, any> | null = null;
    events_target: {
        target: MusicParticle,
        dx: 0,
        dy: 0,
        timer: number
    } = {
        target: null,
        dx: 0,
        dy: 0,
        timer: 0
    };
    events_timer: number | null = null;
    events_status: 'pending' | 'opened' | 'updating' = 'pending';

    events_sets: {
        /*基本信息*/
        particle: MusicParticle;
        /*受影响程度*/
        power: number;
        batch: number;
    }[] = []
    ;

    events_batch: number = 0;

    /*批量处理受作用的粒子*/
    flushEvents() {
        /*选出最靠近的粒子,也就是受影响最大的粒子*/
        this.events_sets.sort((pA, pB) => pA.power - pB.power);
        const [candidate, ...rest] = this.events_sets;
        /*剩余的粒子放缩到对应的大小就可以了*/
        /**/
        rest.forEach((event) => {
            return new Tween(event.particle.cur.scale)
                .to(event.particle.from.scale.clone().applyScale(event.power))
                /*进入放大状态*/
                .onUpdate(() => {
                    if (this.events_batch !== candidate.batch) return;
                    event.particle.render();
                }).start();
        });
        new Tween(candidate.particle.cur.scale)
            .to(candidate.particle.from.scale.clone().applyScale(3))
            /*进入放大状态*/
            .onUpdate(() => {
                /*如果处于其他批次*/
                if (this.events_batch !== candidate.batch) return;
                candidate.particle.render();
            })
            .start();
    }

    setEventsTarget(target: MusicParticle, event: {
        dx: number;
        dy: number;
    }) {

        /*直接记录相关批次的信息*/
        const now = this.events_target;
        /*如果已经有了*/
        if (this.events_target.target === target) return;

        /*如果不是这个，那我应该取最小的那个*/
        if (this.events_target.target &&
            this.events_target.target !== target &&
            now.dx ** 2 + now.dy ** 2 < event.dx ** 2 + event.dy ** 2
            && (this.events_status === 'pending' || this.events_status === 'updating')
        ) {
            /*开启新的一个*/
            this.events_target.target = target;
            return;
        }
        // console.log(this.events_target.target === target);

        if (this.events_timer && (this.events_status === 'pending' || this.events_status === 'updating')) {
            /*当前处于的状态如果是仍然是 Pending 才放行*/
            clearTimeout(this.events_timer);
            /*如果仍然处于更新，但是有新的元素来了，那就让出所有权*/
            if (this.events_status === 'updating') {
                this.events_target.target = target;
                return;
            }
        }

        /**/
        this.events_timer = setTimeout(() => {
            this.events_status = 'updating';
            /*等待 100ms */
            /*这 100ms 之内持续变大这个对象*/
            this.events_target.target = target;
            const a = 0.000;
            let v = 0.1;
            const to = 1.8;
            const animate = () => {
                const target = this.events_target.target;
                if (!target) return;

                v += a;
                Math.abs(to - target.cur.scale.x) < v ?
                    target.cur.scale.x = to :
                    to - target.cur.scale.x > 0 ?
                        target.cur.scale.x += v :
                        target.cur.scale.x -= v;


                Math.abs(to - target.cur.scale.y) < v ?
                    target.cur.scale.y = to :
                    to - target.cur.scale.y > 0 ?
                        target.cur.scale.y += v :
                        target.cur.scale.y -= v;
                if (target.cur.scale.x === target.cur.scale.x && target.cur.scale.x === 0.60) {
                    /*执行效果*/
                    /*执行效果*/
                    /*退出响应状态*/
                    this.events_status = 'opened';
                    this.events_target.target = null;
                    return;
                }

                target?.render();
                requestAnimationFrame(animate);
            };
            animate();

        }, 100);
    }

    cancelTarget(target: MusicParticle) {
        if (this.events_target.target !== target) return;
        this.events_target.target = null;
        clearTimeout(this.events_timer as number);
        this.events_status = 'pending';
    }

    constructor(scale: d3.ScaleLinear<any, any>) {
        super();
        const animate = (t: number) => {
            TWEEN.update(t);
            requestAnimationFrame(animate);
        };
        this.scale.raw = scale.copy();
        this.scale.now = scale;
        animate(0);
    }

    setContainer(el: HTMLElement) {
        /*绑定 html 元素*/
        this.container = el;
        this.selected = d3.select(el as Element);

        /*绑定操作对象*/
        this.container.appendChild(this.root.view as HTMLCanvasElement);
        this.root.resizeTo = el;
        this.root.stage.sortableChildren = true;
        this.root.resize(el.clientWidth, el.clientHeight);
        /**/


        this.attachRuler();
        setTimeout(() => {
            this.attachScale();
        });
        return this;
    }

    attachElement() {
        const card = this.selected!
            .classed(cx('relative', css`
              position: relative;
            `), true)
            .append('div')
            .classed(cx(`nodes-tips`, `absolute w-full h-full top-0 left-0`, css`
              top: 0;
              left: 0;
              pointer-events: none;
              z-index: 1;
            `), true)
            .selectAll('.hover_events')
            .data(this.children, d => d.id)
            .enter()
            .filter(item => item.visible)
            .append('div')
            .attr('class', cx('hover_events', 'absolute', css`
              text-align: center;
              background: #2c3e50;
              width: 200px;
              height: 200px;
              transition: clip-path 1s, border-radius 1s;
              clip-path: circle(4px at 50% 50%);
              border-radius: 50%;
              cursor: pointer;
              transform: translate(-50%, -50%);

              &::after {
                content: '';
                display: inline-block;
                position: absolute;
                transition: top 1s, left 1s, height 1s;

                background: #333;
              }

              &:not(.extent):hover {
                clip-path: circle(40px at 50% 50%);
                border: solid 2px #333;
                box-sizing: border-box;

                &::after {
                  width: 100%;
                  height: 100%;
                  top: 50%;
                  left: 50%;
                  border-radius: 50%;

                  transform: translate(-50%, -50%);
                }

              }

              z-index: 0;
              overflow: hidden;

              &.extent {
                z-index: 999;
                clip-path: circle(1000px at 50% 50%);
                border-radius: 6px;

                &::after {
                  width: 50%;
                  height: 100%;
                }
            `))
            .attr('style', d => `position:absolute;top:${d.cur.y}px;left:${d.cur.x}px`)
            .on('click', function () {
                const card = d3.select(this);
                card.classed('extent', !card.classed('extent'));
            });

        card.append('div')
            .attr('class', cx('title',
                css`
                  border-radius: 50%;
                  cursor: pointer;
                  display: inline-block;
                  color: white;
                `))
            .text(d => d.visible)
        ;

        card.each(function (particle: MusicParticle<any>) {
            particle.el = this as Element;
            particle.selected = d3.select(this as Element);
        });

        return this;
    }


    attachRuler() {
        const cursor = new Vector();

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

            `), true)
            .style('display', 'none')
            .style('left', cursor => `${cursor.x}px`)
            .style('top', cursor => `${0}px`)
        ;
        const ruler_dot = ruler!.append('div')
            .classed(cx(
                'ruler_dot',
                css`
                  width: 12px;
                  height: 12px;
                  background: #181818;
                  position: absolute;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  pointer-events: none;
                `
            ), true)
            .style('position', 'absolute')
            .style('top', cursor => `${cursor.y}px`)
        ;
        const ruler_label = ruler!.append('span')
            .classed(cx(css`
              position: absolute;
              color: #2c3e50;
              padding: 0 12px;
              background: #f2f2f2;
            `), true)
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
            cursor.apply({
                x,
                y
            });
            update();
        });


    }

    updateRuler() {

    }

    scale: {
        raw: d3.ScaleLinear<any, any>,
        now: d3.ScaleLinear<any, any>,
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

    attachScale() {
        const template = this.selected!
            .append('div')
            .classed(cx(
                css`
                  position: absolute;
                  width: 100%;
                  height: 20px;
                  background: #2c3e50;
                  z-index: 0;
                `
            ), true);

        this.scaleView.bottom = template.clone()
            .classed(cx(css`
              bottom: 0;
            `), true);

        this.scaleView.top = template.clone()
            .classed(cx(css`
              top: 0;
            `), true)
        ;
        this.updateScale();
    }

    updateScale() {

    }

}
