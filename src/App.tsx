import {defineComponent, onMounted, ref} from "vue";
import {MusicParticle, MusicParticleManager} from "@/MusicParticleAnimator.ts";
import {getRandom} from "@/utils/random.ts";
import * as d3 from 'd3';
import {getTextBitmapData} from "@/utils/image.ts";
import {css, cx, keyframes} from "@emotion/css";


export default defineComponent({
    setup() {


        const container = ref<HTMLElement>();
        const data = new Array(30).fill(0).map((_, row) =>
            new Array(~~(10 * Math.random()))
                .fill(0)
                .map((_, col) => {
                    return {
                        row,
                        col
                    };
                })
        ).flat(1);


        const dataScale = d3.scaleLinear([0, 29], [0, 600]);

        const manager = new MusicParticleManager(dataScale);
        const dt = {height: 900, width: 900};
        const wt = {
            color: "#303438",
            speed: 2.0,
            scale_speed: .08,
            scale: .15,
            group: 2,
            footer_open: false,
            spacing: 75,
            y: {up: dt.height / 2, down: dt.height / 2, direction: "up", year: 0, distance: 0},
            x: {year: 0, amount: 0}
        };


        const $t = {
            radius: 200,
            vpx: 0.5 * dt.width,
            vpy: 0.5 * dt.height,
            vspo_x: 1.5,
            vspo_y: 1.5,
            depth: -5,
            key: 0,
            z: 0,
            stories: [],
            target: 0,
            select_top: 0,
            loaded: !1,
        };

        const particles = data.map((data, index) => {
            const particle = new MusicParticle();
            particle.cur.opacity = 0;

            particle.cur.scale.applyScale(0);
            particle.cur.scale.velocity.apply({
                x: wt.scale_speed,
                y: wt.scale_speed,
            });
            particle.from.scale.apply(particle.cur.scale);

            particle.cur.velocity.apply({
                x: wt.speed,
                y: wt.speed
            });

            particle.id = `${data.row}-${data.col}`;
            particle.data(data);
            return particle;
        });


        onMounted(() => {

            const size = container.value?.getBoundingClientRect() as DOMRect;
            const {max} = manager.boundary;
            max.x = 800;
            max.y = 800;
            manager
                .setContainer(container.value as HTMLElement)
                .appendChild(particles);
            manager.children.forEach((particle: MusicParticle, index) => {
                const data = particle.data();
                const random_dot = manager.getRandomDotAtBoundary();
                const aim_dot = {x: dataScale(data.row) + 20, y: data.col * 20 + 50};
                particle.cur.apply(random_dot);
                particle.to.apply(aim_dot);
                particle.to.scale.applyScale(wt.scale);


                // for (var t = $t.key, a = 0, o = ht; o > a; a++) {
                //     {
                //         var n = ft[a];
                //         n.gs;
                //     }
                //     if (t >= a) {
                //         var i = R(a),
                //             r = D(a);
                //         $t.loaded,
                //             (n.z = 5 * Math.cos(a / (0.5 * t))),
                //             (n.gx = r + (r - $t.vpx) * (n.z / $t.depth / $t.vspo_x)),
                //             (n.gy = i + (i - $t.vpy) * (n.z / $t.depth / $t.vspo_x)),
                //             (n.gs = (n.gy * (n.z / $t.depth + 1)) / 3e3);
                //     } else n.gs = 0.001;
                //     Math.abs(n.position.x - n.gx) > 25 &&
                //     ((e = !1), $t.loaded && (n.position.x = n.gx - 25)),
                //     Math.abs(n.position.y - n.gy) > 25 &&
                //     ((e = !1), $t.loaded && (n.position.y = n.gy - 25)),
                //         a == $t.target
                //             ? ($("#event").css("left", n.position.x + bt.marginx + "px"),
                //                 $("#event").css("top", n.position.y + bt.marginy + "px"),
                //                 (n.speed = 10),
                //             1 == n.os && ((n.scale_speed = 2 * wt.scale_speed), (n.gs = 2.5)))
                //             : (n.os = 0);
                // }
                // 1 == e && ($t.loaded = !0);
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
                    manager.scale.now.domain(scale.domain());

                    manager.children.forEach(
                        (particle: MusicParticle) => {
                            const data = particle.data();
                            particle.cur.velocity.apply({
                                x: wt.speed + 1,
                                y: wt.speed + 1,
                            });
                            particle.to.x = scale(data.row);

                            particle.to.scale.apply({
                                x: transform.k * wt.scale,
                                y: transform.k * wt.scale
                            });
                            particle.from.scale.apply(particle.to.scale);
                        }
                    );
                    manager.toward();
                    manager.updateScale();
                }).scaleExtent([0.8, 2.5])
            ;

            d3.select(container.value as Element)
                .call(zoom.transform, d3.zoomIdentity)
                .call(zoom)
                .on("dblclick.zoom", null);

        });

        return () => <div ref={container} class={cx(
            css`
              overflow: hidden;

              .hover_events {
                display: none;
              }
            `
        )}>
            <ul class={cx(
                css`
                  width: 100%;
                  background: transparent;
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
                  height: 14px;
                  padding: 12px;

                  &:hover, &.open {
                    height: 192px;
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

                  &:hover .category {
                    animation-duration: 2s;
                    animation-fill-mode: both;
                    animation-name: ${titleWindKeyframes};
                  }
                `,
                'flex w-full h-full'
            )}>
                <ul class={cx('category', 'w-100px', 'border-solid', css`

                `)}>
                    <li>
                        分类
                        <ul>
                            <li>子分类</li>
                        </ul>
                    </li>
                </ul>
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
