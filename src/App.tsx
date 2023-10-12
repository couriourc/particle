import {defineComponent, onMounted, reactive, ref, shallowRef, Transition} from "vue";
import {
    MusicParticle,
    type MusicParticleConfig,
    type MusicParticleContainerConfig,
    type MusicParticleFooterConfig,
    MusicParticleManager
} from "@/MusicParticleAnimator.ts";
import * as d3 from 'd3';
import {css, cx, keyframes} from "@emotion/css";

import 'animate.css';
import {Color} from "pixi.js";
import Move from '@/assets/move.png';

export default defineComponent({
    props: {
        value: {
            type: Array
        }
    },
    setup(props: {
        value: []
    }) {
        console.log(props.value);
        const container = ref<HTMLElement>();
        type MusicParticleData = {
            row: number;
            row_all: number;
            col: number;
            col_all: number;
            time: string;
        }
        const data: (MusicParticleData & {
            is_mvp: boolean
        })[]
            = new Array(50).fill(10).map((one, row, rows) =>
            new Array(~~(Math.random() * 20))
                .fill(1)
                .map((_, col, cols) => {
                    return {
                        row,
                        col,
                        row_all: rows.length,
                        col_all: cols.length,
                        all_data: rows.length * cols.length,
                        index: row * cols.length + col,
                        is_mvp: Math.random() < 0.008,
                        data: _
                    };
                })
        ).flat(1);


        /*始终用第几行作为标准，而不是时间*/
        const dataScale = d3
            .scaleLinear()
            .domain([0, props.value?.length]);

        const parentScale = d3
            .scaleLinear()
            .domain([0, props.value?.length]);

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
                center: {
                    x: 0,
                    y: 0
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
                          border: white solid 1px;
                          background: radial-gradient(50% 50% at 50% 50%, #476CCB 0%, rgba(85, 111, 205, 0.90) 61.98%, rgba(95, 121, 214, 0.00) 100%);

                          &.moving {
                            background-image: url(${Move});
                          }
                        `
                    },
                    /**/
                    ruler_line: {
                        css: css`
                          border-left: solid 2px rgba(255, 255, 255, .2);
                          z-index: 1;
                        `
                    }
                },
                scaler: {
                    css: css`
                      background: #2c3e50;
                    `,
                    top: {
                        css: css`
                          z-index: 0;
                        `
                    },
                    bottom: {}
                },
                cursor: {
                    x: 0,
                    y: 0,
                    scale: 1,
                    width: 12,
                    height: 12,
                    transform: {
                        x: 0,
                        y: 0,
                        k: 1,
                    }
                }
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
                    color: new Color("#00bcf2"),
                },
                down: {
                    /*下边的粒子颜色*/
                    color: new Color("#eaeef1"),
                },
                mvps: {
                    /*最有价值的某一天 或者某个新闻*/
                    color: new Color("#eaeef1"),
                },
                /*卡片样式*/
                card: {
                    css: css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      background: rgba(32, 37, 65, 0.80);
                      border: 1px solid rgba(255, 255, 255, .4);
                      justify-content: center;
                      z-index: 3;
                      border-radius: 2em;
                      width: 8em;
                      height: 3em;
                      padding: 6px 24px;

                      animation-name: fadeIn;
                      animation-duration: 500ms;
                      text-align: center;

                      color: white;
                      cursor: pointer;
                      transition: width 100ms cubic-bezier(0.47, 0.8, 0.61, 0.13),
                      height 200ms cubic-bezier(0.47, 0.8, 0.61, 0.13);

                      /**/
                      animation-fill-mode: both;
                      /*配置动画效果*/
                      animation-timing-function: cubic-bezier(0.47, 0.8, 0.61, 0.13);

                      &.close {

                        animation-name: fadeOut;
                        animation-duration: inherit;

                      }

                      &.open {
                        animation-name: fadeIn;
                        animation-duration: inherit;

                        .title {
                          animation-name: inherit;
                          animation-duration: inherit;
                          animation-timing-function: inherit;
                        }

                        justify-content: flex-start;
                        width: 250px;
                        height: 125px;
                      }
                    `,
                },
                /*粒子间距*/
                margin: {
                    x: 14,
                    y: 14,
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
                    x: .5,
                    y: .5,
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
        manager.data = props.value;
        /*abs(x)*(((abs(sin(x)))^(2))/(10))*/
        const rand_v = (x: number) => Math.random() * (1 + Math.abs((x - (all_data >> 1)) * Math.sin(x - (all_data >> 1))));
        /*abs(x)*(((abs(sin(x)))^(2))/(10))*/
        /*from f(x) = |x * sin(x)|*/
//        const rand_scale = (x: number) => Math.random() * (1 + Math.abs((x - (all_data >> 1)) * Math.sin(x - (all_data >> 1))));
        if (all_data < 5000) {
            wt.particle.scale.x = wt.particle.scale.y = 2;
        }


        const particles = data.map((data, index) => {
            /*保存粒子的初始状态*/
            const particle = new MusicParticle(wt.particle);
            particle.cur.opacity = 1;
            particle.cur.scale.applyScale(0);
            particle.cur.scale.velocity.apply(wt.particle.scale_speed);
            particle.from.scale.apply(particle.cur.scale);

            particle.cur.velocity.apply({
                x: wt.particle.speed.x + rand_v(index),
                y: wt.particle.speed.y + rand_v(index),
            });
            particle.id = `${data.row}-${data.col}`;
            particle.data(data);
            return particle;
        });

        const isLess = ref(false);
        const isMore = ref(false);

        onMounted(() => {
            const size = container.value?.getBoundingClientRect() as DOMRect;
            const {max} = manager.boundary;

            /*设置初始状态*/
            wt.container.size = size;
            all_data < 50 && (wt.container.center.x = (size.width >> 1) - 200);
            wt.particle.direction === 'both' && (wt.container.center.y = size.height >> 1);


            max.x = size.width;
            max.y = size.height;

            manager.scale.now.range([wt.container.margin.left, size.width - wt.container.margin.right]);
            manager.scale.raw.range([wt.container.padding.left, size.width - wt.container.padding.right]);

            manager.parent_scale.now.range([wt.container.padding.left, size.width - wt.container.padding.right]);
            manager.parent_scale.raw.range([wt.container.padding.left, size.width - wt.container.padding.right]);


            manager.setContainer(container.value as HTMLElement)
                .appendChild(particles);

            manager.children.forEach((particle) => {
                const random_dot = manager.getRandomDotAtBoundary();
                particle.cur.apply(random_dot);
                particle.to.scale.apply(wt.particle.scale);
            });
            manager.attachElement()
                .load();
            manager.onUpdateScale(() => {
                handleTestResume();
            });

            manager.setState(wt.container)
                .setChildrenState(wt.particle);

            const zoom = d3
                .zoom()
                .on('zoom', function (event) {
                    const transform = event.transform;
                    const scale = transform.rescaleX(manager.scale.raw);
                    /*相对父元素*/
                    const p_now_min = manager.parent_scale.raw(scale.domain()[0]);
                    const p_min = manager.parent_scale.raw(manager.parent_scale.raw.domain()[0]);
                    /*相对父元素*/
                    const p_now_max = manager.parent_scale.raw(scale.domain()[1]);
                    const p_max = manager.parent_scale.raw(manager.parent_scale.raw.domain()[1]);

                    isLess.value = p_now_min < p_min || p_now_max > p_max + 100;
//                    if (p_now_min < p_min || p_now_max > p_max) return;
                    Object.assign(wt.container.transform, transform);
                    Object.assign(wt.particle.transform, transform);
                    /*同步状态*/
                    manager.scale.now.domain(scale.domain());
                    manager
                        .setState(wt.container)
                        .setChildrenState(wt.particle).updateScale();
                })
                .scaleExtent([1, 1.2])
            ;


            manager.setState(wt.container)
                .setChildrenState(wt.particle)
                .updateScale();
            d3.select(container.value as Element)
                .call(zoom.transform, d3.zoomIdentity)
                .call(zoom)
                .on("dblclick.zoom", null);

        });


        const test = ref(false);

        function handleTestAppear(): any {
            manager.children.forEach((particle, index) => {
                particle.appear();
            });
        }

        function handleTestResume() {
            manager.children.forEach(
                (particle) => {
                    /*在基速度的基础上*/
                    const ordered_scale = particle.order_random_scale();
                    const ordered_pos = particle.order_pos();
                    particle.cur.velocity.apply(ordered_pos.velocity);
                    particle.to.apply(ordered_pos);
                    particle.to.scale.apply(ordered_scale);
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
                      top: 2em;
                      left: 10em;
                      border: solid 1px rgba(255, 255, 255, .2);
                      padding: 12px;
                      animation-name: slideInLeft;
                      animation-duration: 400ms;
                      animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);
                      color: #f2f2f2;

                      opacity: 1;
                      //translate: 0 -50%;

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
                      padding: 0 24px;


                    `)}>
                    </div>
                </div>
                <ul
                    class={cx(
                        "scroll-x-list",
                        "w-full w-inherit",
                        "tracking-normal",
                        "flex flex-row gap-16px",
                        css`
                          width: 100%;
                          right: 0;
                          position: absolute;
                          text-align: center;

                          transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12),
                          bottom 0.7s linear;

                          cursor: pointer;
                          clip: rect(-11px, auto, auto, auto);
                          bottom: 18px;
                          line-height: 29px;
                          list-style: none;
                          padding: 12px;
                          background: #1c2734;

                          .category {
                            cursor: pointer;
                            transition-duration: 200ms;
                            height: 0 !important;
                            transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12),
                            bottom 0.7s linear;
                          }

                          &:hover, &.open {
                            //height: 200px;
                            -webkit-transition-delay: 0s;
                            -moz-transition-delay: 0s;
                            transition-delay: 0s;
                            line-height: unset;
                            z-index: 99999;

                            .category {
                              height: 150px !important;
                            }

                            .category-legend {
                              //display: none;
                              transition: height 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12);
                              height: 0;
                              width: 0;
                              overflow: hidden;
                            }
                          }

                          ul {
                            padding: 0;
                            margin: 0;
                            list-style: none;
                          }

                          &.open .category {
                            animation-duration: 2s;
                            animation-fill-mode: both;
                            animation-name: ${titleWindKeyframes};
                          }

                          & :has(.category:hover) {
                            height: 50%;
                          }
                        `
                    )}
                >

                    <li class={cx('category-legend', 'w-100px', 'border-solid', css`
                      background: transparent;
                      color: #f2f2f2;
                      overflow: hidden;
                      border: 1px solid rgba(255, 229, 218, 0.19);
                      box-shadow: 0 0 4px 0 rgba(202, 202, 202, 0.25);
                    `)}
                    >
                        <div>事件</div>
                    </li>

                    {[
                        {}
                    ].map((item) => (
                        <li
                            class={cx(
                                "category",
                                "inline-block ",
                                css`
                                  &:nth-child(1) {
                                    margin-left: 0;
                                  }

                                  &:nth-last-child(1) {
                                    margin-right: 0;
                                  }

                                  position: relative;
                                  overflow: hidden;
                                  cursor: pointer;
                                `
                            )}
                        >
                            <div
                                class={cx(
                                    "flex gap-12px",
                                    "p-11px",
                                    css`
                                      width: 250px;
                                      flex-shrink: 0;
                                      border-radius: 8px;
                                      border: 1px solid rgba(255, 229, 218, 0.19);
                                      box-shadow: 0 0 8px 2px rgba(64, 24, 16, 0.25);
                                      color: #fff;
                                      font-size: 14px;
                                      font-style: normal;
                                      font-weight: 400;
                                      transition: background-color 0.7s cubic-bezier(0.075, 0.96, 0.595, 1.12);
                                      background: linear-gradient(0deg, transparent);

                                      transition-duration: .7s;

                                      &.active,
                                      &:hover {
                                        background: linear-gradient(20deg,
                                        transparent 80%,
                                        rgba(63, 146, 255, 0.47) 104.29%);
                                      }
                                    `,
                                    {
//                                        active: curCategory.value === item.category,
                                    }
                                )}
                            >
                                <div
                                    class={cx(
                                        "category-item__title",
                                        "w-full h-full",
                                        "rounded-8px",
                                        "flex flex-col flex-justify-center flex-items-center gap-7px",
                                        css`
                                          width: 95px;
                                          height: 120px;
                                          flex-shrink: 0;
                                          border-radius: 8px;
                                          background: rgba(0, 0, 0, 0.2);
                                          box-shadow: 0 0 4px 0 rgba(202, 202, 202, 0.25);
                                          color: #f2f2f2;
                                          font-size: 16px;
                                          font-weight: 400;
                                        `
                                    )}
                                >
                                    <div
                                        class={cx(
                                            css`
                                              width: 48px;
                                              height: 48px;
                                              flex-shrink: 0;
                                              border: solid rgba(202, 202, 202, 0.25) 1px;
                                            `,
                                            "rounded-full",
                                            "flex flex-justify-center flex-items-center"
                                        )}
                                    >
                                    </div>
                                    <span>事件</span>
                                </div>
                                <ul
                                    class={cx(
                                        `category-item-list`,
                                        "w-full",
                                        "flex flex-col gap-4px"
                                    )}
                                >
                                    {[]?.slice(0, 3)?.map((category) => (
                                        <li
                                            class={cx("category-item-list__item", "cursor-pointer")}
                                        >
                                            <div
                                                class={cx(
                                                    "flex flex-justify-between flex-items-center",
                                                    "duration-200ms",
                                                    "bg-white bg-opacity-10 rounded py-4px px-11px",
                                                    "hover:bg-red-400 hover:bg-opacity-50 hover:text-!white"
                                                )}
                                                onClick={() => {
//                                                    data.value = category.data;
                                                }}
                                            >
                                                {/*    <span class={cx('inline-block max-w-6em truncate')}*/}
                                                {/*          title={category.title}>{category.title}</span>*/}
                                                {/*<span class={cx("font-bold")}>{category.total}</span>*/}
                                            </div>
                                        </li>
                                    ))}

                                    <li
                                        //                                        v-show={item.category.length > 3}
                                        class={cx(
                                            `cursor-pointer text-center text-white text-opacity-60 hover:text-opacity-100 duration-200ms`
                                        )}
                                        onClick={() => {

                                        }}
                                    >
                                    </li>
                                </ul>
                            </div>
                        </li>
                    ))}
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

