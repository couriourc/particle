import {defineComponent, onMounted, ref} from "vue";
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';
import {Easing, Tween, update} from "@tweenjs/tween.js";

export default defineComponent({
    setup() {
        const canvas = ref<Element>();
        const scene = new THREE.Scene();

        onMounted(() => {
            // material
            const pointMaterial = new THREE.PointsMaterial({
                size: 0.01,
                sizeAttenuation: true,
            });

            const gList: Float32Array[] = [];

            const particlesGeometry = new THREE.BufferGeometry();

            function gen(count = 50000) {
                const positions = new Float32Array(count * 3); // 每个点由三个坐标值组成（x, y, z）
                for (let i = 0; i < count * 3; i += 1) {
                    positions[i] = (Math.random() - 0.5) * 5 * Math.cos(i);
                }
                return positions;
            }


            gList.push(gen(), gen(), gen());

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(gList[0], 3));
            const particles = new THREE.Points(particlesGeometry, pointMaterial);


            scene.add(particles);

            /*toggle*/
            const toggle = (i: number) =>
                new Tween(
                    particlesGeometry.attributes.position.array
                ).to(gList[i])
                    .easing(Easing.Quadratic.InOut)
                    .onUpdate(function () {
                        pointMaterial.needsUpdate = true;
                        particlesGeometry.attributes.position.needsUpdate = true;
                    })
                    .duration(1000)
                    .onComplete(() => {
                        setTimeout(() => {
                            toggle((i + 1) % (gList.length));
                        });
                    }).start();

            toggle(1);

            /**
             * Lights
             */
            const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
            scene.add(ambientLight);

            // Size
            const sizes = {
                width: window.innerWidth,
                height: window.innerHeight,
            };

            // Camera
            const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
            camera.position.set(2, 1.8, 5);

            const controls = new OrbitControls(camera, canvas.value);
            controls.enableDamping = true;
            // controls.autoRotateSpeed = 0.2
            controls.zoomSpeed = 0.1;

            // Renderer
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas.value,
            });
            renderer.setSize(sizes.width, sizes.height);
            // Animations
            const tick = (time: number) => {
                update();

                controls.update(time);
                renderer.render(scene, camera);
                requestAnimationFrame(tick);
            };
            tick(0);

            /**
             * Debug
             */
            const gui = new dat.GUI();
            gui.add(controls, 'autoRotate');
            gui.add(controls, 'autoRotateSpeed', 0.1, 10, 0.01);
            gui.add(pointMaterial, 'size', 0.01, 0.1, 0.001);
            gui.add(pointMaterial, 'sizeAttenuation');

        });

        return () => <>
            <canvas ref={canvas}></canvas>
        </>;
    }
});
