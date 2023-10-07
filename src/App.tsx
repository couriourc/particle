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

        const dataScale = d3.scaleLinear([0, data.length - 1], [0, 900]);
        const rawScale = dataScale.copy();

        const dt = {height: 900, width: 900};
        const wt = {
            color: "#303438",
            speed: 2.0,
            scale_speed: .08,
            scale: .05,
            group: 2,
            footer_open: false,
            spacing: 75,
            y: {up: dt.height / 2, down: dt.height / 2, direction: "up", year: 0, distance: 0},
            x: {year: 0, amount: 0}
        };

        const particles = data.map((data, index) => {
            const particle = new MusicParticle();
            particle.cur.opacity = 0;

            particle.cur.scale.applyScale(0);
            particle.cur.scale.velocity.apply({
                x: wt.scale_speed,
                y: wt.scale_speed,
            });

            particle.cur.velocity.apply({
                x: wt.speed,
                y: wt.speed
            });

            particle.id = data;
            return particle;
        });


        onMounted(() => {

            const size = container.value?.getBoundingClientRect() as DOMRect;
            const {max} = manager.boundary;
            max.x = 800;
            max.y = 800;
            console.log(size);
            manager
                .setContainer(container.value as HTMLElement)
                .appendChild(particles);
            manager.children.forEach((particle, index) => {
                const random_dot = manager.getRandomDotAtBoundary();
                const aim_dot = {x: index * 10, y: 200};
                particle.cur.apply(random_dot);
                particle.to.apply(aim_dot);
                particle.to.scale.applyScale(wt.scale);
            });
            manager
                .attachElement()
                .duration(309)
                .delay(() => Math.round(Math.random() * data.length))

                .load()

                .toward()
                .then(() => {
                });


        });

        return () => <div ref={container}>

        </div>;
    }
});
