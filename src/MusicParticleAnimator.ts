import {applyVector, MovementVector, ParticleAnimator, ParticleManager, Vector} from "./Particle";
import type {ICanvas} from 'pixi.js';
import {Application, Sprite, Graphics, Container, Texture} from "pixi.js";
import {delay} from "./utils/fn";
import * as d3 from 'd3';
import * as TWEEN from '@tweenjs/tween.js';
import {InteractionManager} from "@pixi/interaction";
import {css, cx} from "@emotion/css";
import {EventEmitter} from "@pixi/utils";
import {Circle} from "@pixi/core";

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
    shape: Graphics = new Graphics();
    container: Container = new Container();
    events: InteractionManager = new InteractionManager(this.shape);

    el: Element;
    selected: d3.Selection<Element, any, any, any>;


    private async initShape() {
//        this.shape.texture ;
        const data = this.data();
        this.shape.beginFill(data.col > (data.col_all >> 1) ? '#16105B' : '#2745AE');
        this.shape.drawCircle(0, 0, 2);
        this.shape.endFill();
        this.shape.eventMode = 'dynamic';
        this.container.addChild(this.shape);
        this.manager?.root.stage.addChild(this.container);

        this.shape.on('pointertap', () => {
//            debugger;
        });
        this.shape.on('pointerover', () => {
            this.manager?.addEvents(this);
        });
        this.shape.on('pointerleave', () => {
            this.manager?.removeEvents(this);
        });
//        this.on('life:remove', () => {
//            this.to.apply({
//                x: ([this.manager?.boundary.min.x, this.manager?.boundary.max.x][Math.random() > 0.5 ? 0 : 1]),
//                y: ([this.manager?.boundary.min.y, this.manager?.boundary.max.y][Math.random() > 0.5 ? 0 : 1]),
//            });
//            this.to.scale.applyScale(0);
//        });
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
//                    const cur = this.cur;
//                    this.cur.to(this.to, resolve);

                    let place = 0b00000; // x y scalex scaley
                    ease(this.cur, to, 'x', () => place |= 0b10000);
                    ease(this.cur, to, 'y', () => place |= 0b01000);
                    ease(this.cur.scale, to.scale, 'x', () => place |= 0b00100);
                    ease(this.cur.scale, to.scale, 'y', () => place |= 0b00010);

                    this.render();
                    if (place === 0b1111) {
//                        debugger;
                        resolve(this);
                        this.animating = null;
                        return;
                    }
                    return requestAnimationFrame(animate);
                };
                animate.bind(this)();
//                delay(, this.$delay)();
            }
        );
        return this.animating;
    }

    render() {
        this.shape.visible = this.visible;
        this.shape.alpha = 0.8;
        applyVector(this.shape, this.cur.clone());
        applyVector(this.shape.scale, this.cur.scale.clone());

//        this.selected?.datum(this)
//            .style('position', 'absolute')
//            .style('top', `${this.cur.y}px`)
//            .style('left', `${this.cur.x}px`)
//            .style('transform', `scale(${this.shape.scale.x})`);

        return this;
    }


    public remove(): boolean {
        console.log('removeing');
        this.selected.classed('removed', true);
        this.selected.remove();
        return super.remove();
    }

}


export class MusicParticleManager extends ParticleManager {
    root: Application = new Application<ICanvas>(
        {
            backgroundColor: '#FFF',

        }
    );
    events = new InteractionManager(this.root.renderer);
    container: Element | null = null;
    selected: d3.Selection<Element, any, any, any> | null = null;

    /*批量处理受作用的粒子*/


    constructor(scale: d3.ScaleLinear<any, any>, parent_scale: d3.ScaleLinear<any, any>) {
        super();
        const animate = (t: number) => {
            TWEEN.update(t);
            requestAnimationFrame(animate);
        };
        this.scale.raw = scale.copy();
        this.scale.now = scale;

        this.parent_scale.raw = parent_scale.copy();
        this.parent_scale.now = parent_scale;
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

        this.root.resize();
        /**/

        this.attachEvent();
        this.attachRuler();
        this.attachScale();
        return this;
    }

    attachEvent() {

    }

    attachElement() {

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
            .style('top', () => `${0}px`)
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

    parent_scale: {
        raw: d3.ScaleLinear<any, any> | any,
        now: d3.ScaleLinear<any, any> | any,
    } = {};

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
    } = {
        slider: null,
        start: {
            slider: null,
            value: null
        },
        end: {
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


        const slider_container = this.scaleView.bottom!
            .append('div')
            .classed('slider', true)
            .classed(cx(`absolute`, css`
              height: 100%;
              background: blanchedalmond;
              cursor: pointer;
              z-index: 999;

              .slider_item {
                cursor: pointer;
                position: absolute;
                top: 0;
                width: 12px;
                height: 100%;
                background: white;

                &.end_slider {
                  right: 0;
                }
              }
            `), true)
        ;
        const start_range_slider = slider_container!
            .datum(this.slider.start)
            .append('div')
            .classed('slider_item start_slider', true)
        ;
        const end_range_slider = slider_container!
            .datum(this.slider.end)
            .append('div')
            .classed('slider_item end_slider', true)
        ;

        slider_container
            .datum(this.slider)
            .style('width', (d) => Math.round(this.parent_scale.now(d.end.value) - this.parent_scale.now(d.start.value)) + 'px')
        ;
        this.slider.slider = slider_container;
        this.slider.start.slider = start_range_slider;
        this.slider.end.slider = end_range_slider;

        this.updateScale();
    }

    updateScale() {
        const start = this.parent_scale.now(this.slider.start.value);
        const end = this.parent_scale.now(this.slider.end.value);
        (this.slider.slider as d3.Selection<Element, any, any, any>)?.style('left', () => start + 'px')
            .style('width', () => Math.round(end - start) + 'px')
        ;
    }

    events_target: Set<MusicParticle> = new Set();
    events_timeout: number | null = null;
    pority = null;

    removeEvents() {
        this.children.forEach(particle => {
            particle.to.scale.apply(particle.from.scale.clone());
        });
    }

    shuffle() {
        /*将children洗牌*/
//            .forEach(
//                (particle, index) => {
//                    this.children[index].to.apply(particle.cur.clone());
//                });
//        this.toward();
    }

    /*消失在外边去*/
    randomAppear() {
        const {min, max} = this.boundary;
        this.children.forEach(
            particle => {
                particle.to.apply({
                    x: [min.x - 10, max.x + 10][(Math.random() > 0.5) ? 0 : 1],
                    y: [min.y - 10, max.y + 10][(Math.random() > 0.5) ? 0 : 1]
                });
            }
        );
        this.toward();
    }
}
