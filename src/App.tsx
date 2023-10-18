import {defineComponent, onMounted, onUnmounted, reactive, ref, shallowRef, Transition} from "vue";
import {
    MusicParticle,
    type MusicParticleConfig,
    type MusicParticleContainerConfig,
    type MusicParticleFooterConfig,
    MusicParticleManager
} from "@/MusicParticleAnimator.ts";
import * as d3 from 'd3';
import {css, cx} from "@emotion/css";

import 'animate.css';
import {Color} from "pixi.js";
import Move from '@/assets/move.png';
import {titleWindKeyframes} from "@/animation/keyframes.ts";
import {isUndef} from "./utils/is";
import {D3ZoomEvent} from "d3";
import {throttle} from "./utils/fn";

export default defineComponent({
    props: {
        value: {
            type: Array,
            required: true
        }
    },
    setup(props) {
        const container = ref<HTMLElement>();

        const genMock = (row = 50) => new Array(row).fill(10).map((one, row, rows) =>
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
                        is_mvp: false,
                        data: _
                    };
                })
        ).flat(1);
        type MusicParticleData = {
            row: number;
            row_all: number;
            col: number;
            col_all: number;
            time: string;
        }
        const data: FlatArray<Partial<(MusicParticleData & {
            is_mvp: boolean
        })>[][], 1>[] = genMock(1200);


        /*始终用第几行作为标准，而不是时间*/
        const dataScale = d3
            .scaleLinear()
            .domain([0, 1200]);

        const parentScale = d3
            .scaleLinear()
            .domain([0, 1200 * 2]);

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
                    y: 0,
                },
                gap: {
                    /*中间间隔*/
                    height: 5,
                },
                background: new Color('#1c2734'),
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
                        x: 100,
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
                    color: new Color("#6f94cd"),
                },
                down: {
                    /*下边的粒子颜色*/
                    color: new Color("#eaeef1"),
                },
                mvps: {
                    /*最有价值的某一天 或者某个新闻*/
                    color: new Color("#eaeef1"),
                },
                /*粒子尺寸*/
                size: 2,
                /*卡片样式*/
                card: {
                    css: css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      background: transparent;
                      border: 1px solid rgba(255, 255, 255, .4);
                      justify-content: center;
                      z-index: 3;
                      border-radius: 100%;
                      width: 6em;
                      height: 6em;
                      padding: 6px 24px;

                      animation-duration: 500ms;
                      animation-fill-mode: both;
                      text-align: center;

                      color: white;
                      cursor: pointer;
                      transition: width 250ms cubic-bezier(0.47, 0.8, 0.61, 0.13),
                      height 250ms cubic-bezier(0.47, 0.8, 0.61, 0.13), border 250ms;

                      overflow: hidden;

                      /**/
                      /*配置动画效果*/
                      animation-timing-function: cubic-bezier(0.47, 0.8, 0.61, 0.13);

                      &.up {
                        border: 2px solid rgba(111, 148, 205, .4);
                      }

                      &.down {
                        border: 2px solid rgba(255, 255, 255, .4);
                      }

                      &.up .title {
                        color: #f2f2f2 !important;
                      }

                      &.down .title {
                        color: black !important;
                      }

                      &.close {

                        animation-name: fadeOut;
                        animation-duration: inherit;

                      }

                      &.open {
                        animation-name: fadeIn;
                        animation-duration: inherit;
                        animation-fill-mode: both;

                        .title {
                          animation-name: inherit;
                          animation-duration: inherit;
                          animation-timing-function: inherit;
                        }

                        justify-content: flex-start;
                        width: 250px;
                        height: 125px;
                        background: #f2f2f2;
                        border-radius: 6px;
                      }

                      &.up.open {
                        background: rgb(61, 65, 69);
                      }
                    `,
                },
                /*粒子间距*/
                margin: {
                    x: 10,
                    y: 10,
                },
                /*粒子移动的基速度*/
                speed: {
                    x: 20.0,
                    y: 20.0,
                },
                /*粒子放大的基速度*/
                scale_speed: {
                    x: 0.5,
                    y: 0.5,
                },
                /*粒子初始放缩大小*/
                transform: {
                    k: 1,
                    x: 0,
                    y: 0,
                },
                scale: {
                    x: 1,
                    y: 1,
                    extent: [1, 1.8]
                },
                opacity: {
                    hover: 1,
                    normal: 0.8
                },
                get sensitivity() {
                    return Math.round(20 + 2 * Math.PI * (this.scale.x ** 2));
                },
            },
            /*当前的状态*/
            footer: {
                isOpen: false,
            },
            /**/
        };


        const manager = new MusicParticleManager(dataScale, parentScale, wt.container);

        const all_data = data.length;
        manager.data = props.value;


        const isLess = ref(false);
        const isMore = ref(false);

        function initState() {

            const size = container.value?.getBoundingClientRect() as DOMRect;
            const {max} = manager.boundary;

            max.x = size.width;
            max.y = size.height;

            /*设置初始状态*/
            wt.container.size = size;
            all_data < 50 && (wt.container.center.x = (size.width >> 1) - 200);
            wt.particle.direction === 'both' && (wt.container.center.y = size.height >> 1);

            /*设置比例尺*/
            manager.scale.now.range([wt.container.margin.left, size.width - wt.container.margin.right]);
            manager.scale.raw.range([wt.container.padding.left, size.width - wt.container.padding.right]);
            /*同步父元素的比例尺信息*/
            manager.parent_scale.now.range([wt.container.padding.left, size.width - wt.container.padding.right]);
            manager.parent_scale.raw.range([wt.container.padding.left, size.width - wt.container.padding.right]);
        }

        function setupManager() {
            manager.setContainer(container.value as HTMLElement);
            manager.setState(wt.container);
        }

        function bindEvent() {
            /*调整比例尺的时候会重置位置*/
            manager.onUpdateScale((_, __, status) => {
                isLess.value = status === 'less';
                isMore.value = status === 'more';
                handleTestResume();
            });

//
            const zoom = d3
                .zoom()
                .on('zoom', throttle(function (event: D3ZoomEvent<any, any>) {
                    const transform = event.transform;
                    if (!(event.sourceEvent && isUndef(event.sourceEvent.deltaX))) {
                        /*这是滚轮移动，这种情况下移动无效，放大有效*/
                        transform.x = wt.container.transform.x;
                    }
                    /*说明没有动，就不通知更新*/
                    if (transform.k === wt.container.transform.k && transform.x === wt.container.transform.x) return;
                    /**/
                    const [p_start, p_end] = manager.parent_scale.raw.range();
                    const [r_start, r_end] = manager.scale.raw.domain().map(domain => manager.parent_scale.raw(domain));

                    let start = r_start * transform.k + transform.x;
                    let end = r_end * transform.k + transform.x;
                    const checked = manager.checkScale(start, end);
                    if (start < p_start) start = p_start;
                    if (end > p_end) end = p_end;
                    if (start > end) return;

                    Object.assign(wt.container.transform, {
                        k: transform.k,
                        x: transform.x,
                    });
                    Object.assign(wt.particle.transform, {
                        k: transform.k,
                        x: transform.x,
                    });
                    /*同步状态*/
                    manager.scale.now.domain([manager.parent_scale.now.invert(start), manager.parent_scale.now.invert(end)]);
                    manager.setState(wt.container)
                        .setChildrenState(wt.particle)
                        .updateScale(checked);
                }, 25))
                .scaleExtent([1.0, 1.6]);
            d3.select(container.value as Element)
                .call(zoom.transform, d3.zoomIdentity)
                .call(zoom)
                .on("dblclick.zoom", null);
        }

        function loadParticle(data: any[]) {
            const particles = data.map((data) => {
                /*保存粒子的初始状态*/
                const particle = new MusicParticle(wt.particle);
                const random_dot = manager.getRandomDotAtBoundary();

                particle.from.scale.apply(particle.cur.scale);

                particle.cur.apply(random_dot);
                particle.cur.opacity = wt.particle.opacity.normal;

                particle.cur.scale.applyScale(wt.particle.scale.x);
                particle.cur.scale.velocity.apply(wt.particle.scale_speed);
                particle.to.scale.apply(wt.particle.scale);

                particle.id = `${data.row}-${data.col}`;
                particle.data(data);

                particle.setState(wt.particle);
                particle.onParticleUpdate(() => {
                    particle.appear();
                    particle.resume();
                });
                particle.onParticleEnter(() => {
                    particle.resume();
                });
                particle.onParticleRemove(() => {
                    particle.appear().then(() => {
                    });
                });

                return particle;
            });

            manager.appendChild(particles)
                .setChildrenState(wt.particle);
        }

        function setupParticle() {
            initState();
            setupManager();
            /*加载粒子*/
            loadParticle(data);
            /*绑定事件信息*/
            bindEvent();
        }

        onMounted(() => {
            setupParticle();
        });


        const test = ref(false);

        function handleTestAppear(): any {
            manager.children
                .filter(particle => {
                    return particle.data().is_mvp;
                })
                .forEach((particle) => {
                    particle.appear();
                });
        }


        function handleTestResume() {
            manager.resume()
                .then(() => {
                });
        }


        return () => <div class={cx(`h-100vh flex flex-col`)}>
            <div ref={container} class={cx(
                css`
                  overflow: hidden;
                  cursor: none;
                  height: 100%;
                  background: url(${`/assets/img_texture.png`});
                `
            )}>
                <div
                    class={cx('nothing', 'animate__animated', css`
                      position: absolute;
                      top: 2em;
                      border: solid 1px rgba(255, 255, 255, .2);
                      padding: 12px;
                      animation-name: slideInLeft;
                      color: #f2f2f2;
                      opacity: 1;

                      &.tail, &.head {
                        animation-duration: 400ms;
                        animation-timing-function: cubic-bezier(0.28, 0.76, 0.76, 0.23);
                      }

                      &.tail {
                        left: 10em;
                        animation-name: slideInLeft;

                        &.remove {
                          animation-name: slideOutRight;
                        }
                      }

                      &.head {
                        right: 10em;
                        animation-name: slideInRight;

                        &.remove {
                          animation-name: slideOutLeft;

                        }
                      }

                      &.remove {
                        opacity: 0;
                      }


                      border-radius: 12px;
                      cursor: pointer;

                    `, {
                        'remove animate__fadeOutLeft': !isLess.value && !isMore.value,
                        'tail': isMore.value,
                        'head': isLess.value,
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
                        {
                            isLess.value && '已经到最开始了'
                        }
                        {
                            isMore.value && '已经到最后了'
                        }
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
                          min-height: 48px;

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
                              transition-delay: .7s;
                              opacity: 0;
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

                          &:hover .category .category-item__title {
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
