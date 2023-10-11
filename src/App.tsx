import {defineComponent, onMounted, reactive, ref, shallowRef, Transition} from "vue";
import {
    MusicParticle,
    type MusicParticleConfig,
    type MusicParticleContainerConfig, MusicParticleFooterConfig,
    MusicParticleManager, MusicParticleRulerConfig
} from "@/MusicParticleAnimator.ts";
import * as d3 from 'd3';
import {css, cx, keyframes} from "@emotion/css";

import 'animate.css';
import {Color} from "pixi.js";

export default defineComponent({
    props: {
        value: {
            type: Array
        }
    },
    setup() {
        const container = ref<HTMLElement>();
        type MusicParticleData = {
            row: number;
            row_all: number;
            col: number;
            col_all: number;
        }
        const data: (MusicParticleData & {
            is_mvp: boolean
        })[]
            = new Array(30).fill(0).map((_, row, rows) =>
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

        const wt: {
            container: MusicParticleContainerConfig;
            particle: MusicParticleConfig<MusicParticleData>;
            footer: MusicParticleFooterConfig;
        } = {
            /*容器相关配置*/
            container: {
                size: {},
                padding: {
                    left: 24,
                    right: 24,
                },
                scale: {
                    x: 1,
                    y: 1,
                },
                margin: {
                    left: 24,
                    right: 24,
                },
                transform: {
                    k: 1,
                    x: 0,
                    y: 0,
                },
                gap: {
                    /*中间间隔*/
                    height: 5,
                },
                background: new Color('rgba(32, 37, 65, 0.60)'),
                /*配置尺子相关的*/
                ruler: {
                    /**/
                    ruler_dot: {
                        css: css`
                          background: radial-gradient(50% 50% at 50% 50%, #476CCB 0%, rgba(85, 111, 205, 0.90) 61.98%, rgba(95, 121, 214, 0.00) 100%);
                        `
                    },
                    /**/
                    ruler_line: {
                        css: css`
                          border: solid 1px rgb(110, 190, 195);
                          border-image: linear-gradient(180deg, rgba(180, 133, 255, 0.88) 0.83%, #2F5DFF 100%);
                        `
                    }
                },
            },
            /*粒子相关配置*/
            particle: {
                /*当前排列粒子所在方向*/
                direction: 'both',
                checkDirection(particle) {
                    if (this.direction !== 'both') return this.direction;
                    const data = particle.data();
                    if (data.col > data.col_all >> 1) return 'down';
                    return 'up';
                },
                up: {
                    color: new Color("#85C5FF"),
                },
                down: {
                    /*下边的粒子颜色*/
                    color: new Color("#eaeef1"),
                },
                /*粒子间距*/
                margin: {
                    x: 10,
                    y: 10,
                },
                /*粒子移动的基速度*/
                speed: {
                    x: 12.0,
                    y: 12.0,
                },
                /*粒子放大的基速度*/
                scale_speed: {
                    x: .08,
                    y: .08,
                },
                /*粒子初始放缩大小*/
                transform: {
                    k: 1,
                    x: 0,
                    y: 0
                },
                scale: {
                    x: 1,
                    y: 1,
                },

                sensitivity: 40,
            },
            /*当前的状态*/
            footer: {
                isOpen: false,
            },
            /**/
        };

        const footer = reactive(wt.footer);


        const manager = new MusicParticleManager(dataScale, parentScale, wt.container);

        const all_data = data.length;
        const rand = (x) => x - (all_data >> 1) === 0 ? Math.random() : Math.random() * (((x - (all_data >> 1)) ** (2)) / (Math.abs(x - (all_data >> 1))));

        const particles = data.map((data, index) => {
            /*保存粒子的初始状态*/
            const particle = new MusicParticle(wt.particle);
            particle.cur.opacity = 1;
            particle.cur.scale.applyScale(0);
            particle.cur.scale.velocity.apply(wt.particle.scale_speed);
            particle.from.scale.apply(particle.cur.scale);

            particle.cur.velocity.apply({
                x: wt.particle.speed.x + rand(index),
                y: wt.particle.speed.y + rand(index),
            });
            particle.id = `${data.row}-${data.col}`;
            particle.data(data);
            return particle;
        });

        const isLess = ref(false);

        onMounted(() => {
            const size = container.value?.getBoundingClientRect() as DOMRect;
            const {max} = manager.boundary;

            /*设置初始状态*/
            wt.container.size = size;
            manager.setState(wt.container);

            max.x = size.width;
            max.y = size.height;

            manager.scale.now.range([wt.container.margin.left, size.width]);
            manager.scale.raw.range([wt.container.padding.left, size.width]);

            manager.parent_scale.now.range([24, size.width]);
            manager.parent_scale.raw.range([24, size.width]);


            manager.setContainer(container.value as HTMLElement)
                .appendChild(particles);

            manager.children.forEach((particle) => {
                const random_dot = manager.getRandomDotAtBoundary();
                particle.cur.apply(random_dot);
                particle.from.apply(random_dot);
                particle.to.scale.apply(wt.particle.scale);
            });
            manager.attachElement()
                .load();

            manager.onUpdateScale((_, d) => {
                Object.assign(wt.particle.transform, {
                    x: wt.particle.transform.x + d.dx
                });
                handleTestResume();
            });
            const zoom = d3
                .zoom()
                .on('zoom', function (event) {
                    const transform = event.transform;
                    const scale = transform.rescaleX(manager.scale.raw);
                    const [min] = scale.domain();
                    const [r_min] = manager.scale.raw.domain();
                    if (min + 8 < r_min) {
                        isLess.value = true;
                    } else {
                        isLess.value = false;
                    }

                    Object.assign(wt.container.transform, transform);
                    Object.assign(wt.particle.transform, transform);
                    /*同步状态*/
                    manager.scale.now.domain(scale.domain());
                    manager.setState(wt.container)
                        .setChildrenState(wt.particle)
                        .updateScale()
                        .toward();

                }).scaleExtent([1, 1.5]);

            d3.select(container.value as Element)
                .call(zoom.transform, d3.zoomIdentity)
                .call(zoom)
                .on("dblclick.zoom", null);

        });


        const test = ref(false);

        function handleTestAppear(): any {
            manager.appear();
        }

        function handleTestResume() {
            const managerState = manager.getState();
            const transform = wt.particle.transform;
            const size = wt.container.size;

            manager.children.forEach(
                (particle, index) => {
                    const state = particle.getState();
                    const data = particle.data();
                    /*在基速度的基础上*/
                    particle.cur.velocity.apply({
                        x: wt.particle.speed.x + rand(index),
                        y: wt.particle.speed.y + rand(index),
                    });
                    particle.to.x = state.margin.x * data.row + transform.x + managerState.padding.left;
                    particle.to.y =
                        (data.col - (data.col_all >> 1)) * (state.margin.y * transform.k)
                        /*整个中心*/
                        + ((size!.height as number) / 2) - wt.container.gap.height
                        + (data.col > (data.col_all >> 1) ? -(wt.container.gap.height >> 1) : (-wt.container.gap.height << 1));

                    particle.to.scale.apply({
                        x: transform.k,
                        y: transform.k,
                    });
                    particle.from.scale.apply(particle.to.scale);
                }
            );

        }

        return () => <div class={cx(`h-100vh flex flex-col`)}>

            <div ref={container} class={cx(
                css`
                  overflow: hidden;
                  cursor: none;
                  height: 100%;
                `
            )}>
                <div
                    class={cx('nothing', 'animate__animated', css`
                      position: absolute;
                      top: 50%;
                      left: 10em;
                      border: solid 1px;
                      padding: 12px;
                      animation-name: slideInLeft;
                      animation-duration: 400ms;
                      animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);
                      color: #fff;

                      opacity: 1;
                      translate: 0 -50%;

                      &.remove {
                        opacity: 0;

                        animation-name: slideOutLeft;
                        animation-duration: 400ms;
                        animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);
                      }

                      border-radius: 12px;
                      cursor: pointer;

                    `, {
                        'remove animate__fadeOutLeft': !isLess.value
                    })}
                    onClick={() => {
                        if (!test.value) {
                            handleTestAppear();
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
                    'flex w-full h-full gap-10px',
                    {
                        open: footer.isOpen
                    }
                )}>
                    <li class={cx('category', 'w-100px', 'border-solid', css`
                      background: #FFF;
                    `)}
                        onMouseenter={handleTestAppear}
                        onMouseout={handleTestResume}
                    >
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
            </div>
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

