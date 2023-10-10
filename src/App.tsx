import {defineComponent, onMounted, ref, Transition} from "vue";
import {MusicParticle, MusicParticleManager} from "@/MusicParticleAnimator.ts";
import {getRandom} from "@/utils/random.ts";
import * as d3 from 'd3';
import {getTextBitmapData} from "@/utils/image.ts";
import {css, cx, keyframes} from "@emotion/css";

import 'animate.css';

export default defineComponent({
    props: {
        value: {
            type: Array
        }
    },
    setup(props,) {

        const container = ref<HTMLElement>();
        const data = new Array(30).fill(0).map((_, row, rows) =>
            new Array(~~(60 * Math.random()))
                .fill(0)
                .map((_, col, cols) => {
                    return {
                        row,
                        col,
                        row_all: rows.length,
                        col_all: cols.length,
                        is_mvp: Math.random() < 0.08
                    };
                })
        ).flat(1);


        const dataScale = d3.scaleLinear([0, 60], [0, 600]);
        const parentScale = d3.scaleLinear([0, 290], [0, 600]);

        const manager = new MusicParticleManager(dataScale, parentScale);
        const dt = {height: 900, width: 900};
        const wt = {

            /*容器相关配置*/
            container: {
                size: {}
            },
            color: "#303438",
            speed: 12.0,
            scale_speed: .8,
            scale: 1,
            group: 2,
            footer_open: false,
            spacing: 8,
            left_start: 24,
            transform: {},
            marginx: 10,
            marginy: 10,

            y: {up: dt.height / 2, down: dt.height / 2, direction: "up", year: 0, distance: 0},
            x: {year: 0, amount: 0}
        };


        const all_data = data.length;
        const rand = (x) =>
            x - (all_data >> 1) === 0 ? Math.random() :
                Math.random() * (((x - (all_data >> 1)) ** (2)) / (Math.abs(x - (all_data >> 1))));

        const particles = data.map((data, index) => {
            const particle = new MusicParticle();
            particle.cur.opacity = 1;
            particle.cur.scale.applyScale(0);
            particle.cur.scale.velocity.apply({
                x: wt.scale_speed,
                y: wt.scale_speed,
            });
            particle.from.scale.apply(particle.cur.scale);

            particle.cur.velocity.apply({
                /*随机化运动速度*/
                /*调整尺寸应该具有更快的速度*/
                x: wt.speed + (Math.random() + 1) * (rand(index)),
                y: wt.speed + (Math.random() + 1) * (rand(index)),
            });
            particle.id = `${data.row}-${data.col}`;
            particle.data(data);
            return particle;
        });
        const isLess = ref(false);


        onMounted(() => {

            const size = container.value?.getBoundingClientRect() as DOMRect;
            wt.container.size = size;
            const {max} = manager.boundary;
            max.x = size.width;
            max.y = size.height;

            manager.scale.now.range([24, size.width]);
            manager.scale.raw.range([24, size.width]);

            manager.parent_scale.now.range([24, size.width]);
            manager.parent_scale.raw.range([24, size.width]);


            manager
                .setContainer(container.value as HTMLElement)
                .appendChild(particles);
            manager.children.forEach((particle: MusicParticle, index) => {
                const data = particle.data();

                const random_dot = manager.getRandomDotAtBoundary();

                const aim_dot = {
                    x: dataScale(data.row) + 20,
                    y: (data.col - 5 /*以中间为对称中心*/) * (wt.spacing /*尺寸大小*/) + (size.height / 2)
                };
                particle.cur.apply(random_dot);
                particle.from.apply(random_dot);

                particle.to.apply(aim_dot);
                particle.to.scale.applyScale(wt.scale);
            });
            manager
                .attachElement()
                .load()
                .toward()
                .then(() => {
                });

            const zoom = d3
                .zoom()
                .on('zoom', function (event) {
                    const transform = event.transform;
                    const scale = transform.rescaleX(manager.scale.raw);
                    const [min, max] = scale.domain();
                    const [r_min, r_max] = manager.scale.raw.domain();
                    if (min + 8 < r_min) {
                        isLess.value = true;
                    } else {
                        isLess.value = false;
                    }
                    manager.scale.now.domain(scale.domain());

                    //                    if (isLess.value) return;


                    wt.transform = transform;
                    handleTestResume();
                    manager.toward();
                    manager.updateScale();
                }).scaleExtent([1, 1.5])
            ;

            d3.select(manager.root.view as HTMLCanvasElement)
                .call(zoom.transform, d3.zoomIdentity)
                .call(zoom)
                .on("dblclick.zoom", null);

//
//            setTimeout(() => {
////                manager.children.forEach(particle => {
////                    manager.removeChild(particle);
////                });
////                manager.toward()
////                    .then(()=>{
////                        console.log('remove')
////                    });
//            }, 1000);
        });


        const test = ref(false);

        function handleTestEpolid(): any {
            manager.randomAppear()
        }

        function handleTestResume() {
            const transform = wt.transform;
            const size = wt.container.size;
            manager.children.forEach(
                (particle: MusicParticle, index) => {
                    const data = particle.data();
                    particle.cur.velocity.apply({
                        /*随机化运动速度*/
                        /*基础速度加上对半区别*/
                        x: wt.speed + rand(index),
                        y: wt.speed + rand(index),
                    });
                    particle.to.x = wt.marginx * data.row + transform.x + wt.left_start;
                    particle.to.y = (data.col - (data.col_all >> 1))
                        * (wt.marginy * transform.k) + (size.height / 2) - 60
                    ;
                    particle.to.scale.apply({
                        x: transform.k * wt.scale,
                        y: transform.k * wt.scale
                    });
                    particle.from.scale.apply(particle.to.scale);
                }
            );
        }

        return () =>
            <div ref={container} class={cx(
                css`
                  overflow: hidden;
                  height: 100vh;
                `
            )}>
                <div
                    v-show={isLess.value}
                    class={cx('nothing', 'animate__animated', css`
                      position: absolute;
                      top: 50%;
                      left: 10em;
                      border: solid 1px;
                      padding: 12px;
                      animation-name: slideInLeft;
                      animation-duration: 20ms;
                      animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);

                      &.remove {
                        animation-name: slideOutLeft;
                        animation-duration: 20ms;
                        animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);
                      }

                      cursor: pointer;

                    `, {
                        'remove animate__fadeOutLeft': !isLess.value
                    })}
                    onClick={() => {
                        if (!test.value) {
                            handleTestEpolid();
                        } else {
                            handleTestResume();
                        }
                        test.value = !test.value;
                    }
                    }
                >
                    <div>
                        Noting Here 🤐
                    </div>
                    <div class={cx('line', css`
                      border: solid;
                    `)}>
                    </div>
                </div>
                <ul class={cx(
                    css`
                      width: 100%;
                      right: 0;
                      position: absolute;
                      text-align: center;
                      -webkit-transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12),
                      bottom 0.7s linear;
                      -moz-transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12),
                      bottom 0.7s linear;
                      transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12),
                      bottom 0.7s linear;
                      cursor: auto;
                      clip: rect(-11px, auto, auto, auto);
                      bottom: 14px;
                      height: 56px;
                      list-style: none;
                      padding: 12px;
                      background: #1c2734;
                      z-index: 999;

                      &:hover, &.open {
                        height: 200px;
                        -webkit-transition-delay: 0s;
                        -moz-transition-delay: 0s;
                        transition-delay: 0s;
                        z-index: 17;
                      }

                      ul {
                        padding: 0;
                        margin: 0;
                        list-style: none;
                      }

                      .category {
                        cursor: pointer;
                      }

                      &:hover .category {
                        animation-duration: 2s;
                        animation-fill-mode: both;
                        animation-name: ${titleWindKeyframes};
                      }
                    `,
                    'flex w-full h-full gap-10px'
                )}>
                    <li class={cx('category', 'w-100px', 'border-solid', css`
                      background: #FFF;
                    `)}>
                        时间
                        <ul>
                            <li>子分类</li>
                        </ul>
                    </li>
                    <li class={cx('category', 'w-100px', 'border-solid', css`
                      background: #FFF;
                    `)}>
                        事件
                        <ul>
                            <li>子分类</li>
                        </ul>
                    </li>
                </ul>
            </div>;
    }
});

const titleWindKeyframes = keyframes`
  0% {
    opacity: 0;
  }
  5% {
    opacity: 1;
    transform-origin: 50% 0;
    transform: perspective(800px) rotateX(-80deg);
  }
  30% {
    opacity: 1;
    transform-origin: 50% 0;
    transform: perspective(800px) rotateX(30deg);
  }
  70% {
    opacity: 1;
    transform-origin: 50% 0;
    transform: perspective(800px) rotateX(-20deg);
  }
  100% {
    opacity: 1;
    transform-origin: 50% 0;
    transform: perspective(800px) rotateX(0);
  }
`;
