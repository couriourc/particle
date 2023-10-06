import {defineComponent, onMounted, ref} from "vue";
import {MusicParticle, MusicParticleManager} from "@/MusicParticleAnimator.ts";
import {getRandom} from "@/utils/random.ts";
import * as d3 from 'd3';
import {getTextBitmapData} from "@/utils/image.ts";

export default defineComponent({
    setup() {
        const manager = new MusicParticleManager();
        const container = ref<HTMLElement>();
        const data = new Array(30).fill(1).map((_, index) => `${index}`);

        const radScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, 2 * Math.PI]);
        const particles = data.map((data, index) => {
            const particle = new MusicParticle();
            const rad = radScale(index);

            particle.cur.apply({
                x: 1200 * Math.cos(rad),
                y: 1200 * Math.sin(rad)
            });

            particle.to.apply({
                x: 600 + 20 * Math.cos(rad),
                y: 200 + 20 * Math.sin(rad),
            });
            particle.id = data;
            return particle;
        });
        onMounted(() => {
            const now = getTextBitmapData('hello');

            manager
                .setContainer(container.value)
                .appendChild(particles)
                .duration(618)
                .delay((_, index) => Math.random() * 100)
                .load()
                .toward()
                .then((res) => {
                });
            for (let row = 0; row < now.height; row++) {
                for (let col = 0; col < now.width; col++) {
                    const cur = (row + col * now.width) * 4;
                    console.log(now.data.slice(cur,cur+4))
                    if ((cur) % 4) continue;
                    const [r, g, b, a] = now.data.slice(cur, cur + 4);
                    const time = new MusicParticle();
                    time.cur.x = col;
                    time.cur.y = row;
                    console.log(r, g, b, a);
                    time.id = `_cur-${cur}`;
                    manager.appendChild(time);
                }
            }

        });
        return () => <div ref={container}></div>;
    }
});
