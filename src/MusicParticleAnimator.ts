import {Particle, ParticleAnimator, ParticleManager} from "./Particle";
import {Application,} from "pixi.js";
import {Graphics,} from "pixi.js";
import type {ICanvas} from 'pixi.js';
import {delay} from "./utils/fn";
import * as d3 from 'd3';
import * as TWEEN from '@tweenjs/tween.js';
import {Easing} from "@tweenjs/tween.js";

export class MusicParticle<T> extends ParticleAnimator {
    manager: MusicParticleManager<T> | null = null;
    shape: Graphics = new Graphics();

    _data: any;


    data(data: T) {
        this._data = data;
    }

    setManager(manager: MusicParticleManager<T>) {
        this.manager = manager;
        const app = manager.root;
        const graphics = this.shape;

        graphics.beginFill(0x000000);
        graphics.drawCircle(0, 0, 6);
        graphics.endFill();
        app.stage.addChild(this.shape);

        graphics.addEventListener('mouseover', (event) => {
        });
        return this;
    }

    public toward() {

        if (this.animating) {
            return this.animating;
        }
        this.animating = new Promise(
            (resolve) => {

                new TWEEN.Tween(this.cur)
                    .delay(this.$delay)
                    .duration(this.$duration)
                    .easing(Easing.Linear.InOut())
                    .to(this.to)
                    .onUpdate(() => {
                        this.render();
                    })
                    .onComplete(() => {
                        resolve(this);
                    }).start();
            }
        );
        return this.animating;
    }

    render() {
        this.shape.x = this.cur.x;
        this.shape.y = this.cur.y;
        return this;
    }

}

export class MusicParticleManager<T> extends ParticleManager {
    root: Application = new Application<ICanvas>(
        {
            resizeTo: window,
            backgroundColor: '#FFF'
        }
    );

    setContainer(el: HTMLElement) {
        el.appendChild(this.root.view as HTMLCanvasElement);
        const animate = (t) => {
            TWEEN.update(t);
            requestAnimationFrame(animate);
        };
        animate(0);
        return this;
    }

}
