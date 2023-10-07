import {
    applyVector,
    MovementVector,
    Particle,
    ParticleAnimator,
    ParticleManager,
    ParticleMutableProperties
} from "./Particle";
import type {ICanvas} from 'pixi.js';
import {Application, Sprite, Texture,} from "pixi.js";
import {delay} from "./utils/fn";
import * as d3 from 'd3';
import * as TWEEN from '@tweenjs/tween.js';
import {InteractionManager} from "@pixi/interaction";
import ParticleGif from './assets/particle.gif';
import {cx, css} from "@emotion/css";


export class MusicParticle<T> extends ParticleAnimator {
    manager: MusicParticleManager | null = null;
    shape: Sprite = new Sprite();
    events: InteractionManager;
    el: Element;
    selected: d3.Selection<Element, any, any, any>;
    _data: any;

    sensitivity: number = 20;


    data(data: T) {
        this._data = data;
    }

    private async initShape() {
        const app = this.manager!.root;
        const events = this.manager!.events;

        const st = Texture.fromURL(ParticleGif);
        this.shape.texture = await st;
        const graphics = this.shape;

        app.stage.addChild(graphics);
        this.events = new InteractionManager(graphics);

        graphics.anchor.x = .5;
        graphics.anchor.y = .5;

        this.events.on('click', (event) => {
            console.log(event);
        });
        graphics.buttonMode = true;

        graphics.cursor = 'grab';
        const xScale = d3.scaleLinear([this.sensitivity, 0], [1, 2]);
        const initialScale = this.cur.scale.clone();


        events.on('mousemove', (event) => {
            if (!this.visible) return;
            const x = event.data.global.x;
            const y = event.data.global.y;
            const dx = Math.abs(x - this.cur.x);
            const dy = Math.abs(y - this.cur.y);
            const duration = this.$duration;
            if (
                /*增长大小*/
                dx < this.sensitivity
                && dy < this.sensitivity
            ) {
                const minD = Math.min(dx, dy);
                this.to.scale.apply(initialScale.clone().applyScale(xScale(minD)));
                this.duration(200);
            } else {
                this.to.scale.apply(initialScale);
                this.duration(duration);
            }

            this.toward().then(() => {
                this.duration(duration);
            });
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
                    const ease = (
                        source: MovementVector, target: MovementVector,
                        key: 'x' | 'y',
                        over: Function
                    ) => Math.abs(source[key] - target[key]) < source.velocity[key]
                        ? (over(), source[key] = target[key])
                        : target[key] > source[key] ?
                            source[key] += source.velocity[key] :
                            (source[key] -= source.velocity[key]);

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
                animate();
                delay(animate.bind(this), this.$delay)();
//                new TWEEN.Tween(this.cur)
//                    .dynamic(true)
//                    .easing((t:number) => {
//                        console.log(t)
//                        return Math.floor(t);
//                    })
//                    .delay(this.$delay)
//                    .duration(this.$duration)
//                    .easing(Easing.Linear.InOut())
//                    .to(this.to)
//                    .onUpdate(() => {
//                        this.render();
//                    })
//                    .onComplete(() => {
//                        this.animating = null;
//                        resolve(this);
//                    }).start();
            }
        );
        return this.animating;
    }

    render() {
        this.shape.visible = this.visible;
        this.shape.alpha = 0.8;
        applyVector(this.shape, this.cur);
        applyVector(this.shape.scale, this.cur.scale);
        this.selected
            .datum(this)
            .attr('style', d => `position:absolute;top:${d.cur.y}px;left:${d.cur.x}px`);
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
            backgroundColor: '#FFF'
        }
    );
    events = new InteractionManager(this.root.renderer);
    container: HTMLElement;
    events_target: Set<MusicParticle<any>> = new Set();

    constructor() {
        super();
        const animate = (t: number) => {
            TWEEN.update(t);
            requestAnimationFrame(animate);
        };
        animate(0);
    }

    setContainer(el: HTMLElement) {
        this.container = el;
        el.appendChild(this.root.view as HTMLCanvasElement);
        this.root.resizeTo = el;
        this.root.resize();
        return this;
    }

    public appendChild(particle: Particle | Particle[]): this {
        return super.appendChild(particle);
    }

    attachElement() {
        const card = d3.select(this.container)
            .classed(cx('relative'), true)
            .selectAll('.hover_events')
            .data(this.children)
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
              transform: translate(-34%, -34%);

              &::after {
                content: '';
                display: inline-block;
                position: absolute;
                transition: top 1s,left 1s,height 1s;

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
            particle.el = this as HTMLElement;
            particle.selected = d3.select(this as Element);
        })
            .exit()
            .remove();

        return this;
    }


}
