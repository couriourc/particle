import {defineComponent, onMounted, ref} from "vue";
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';
import {Tween, update} from "@tweenjs/tween.js";

export default defineComponent({
    setup() {
        const canvas = ref<Element>();


        onMounted(() => {
            const scene = new THREE.Scene();
            // material
            const pointMaterial = new THREE.PointsMaterial({
                size: 0.01,
                sizeAttenuation: true,
            });

            const gList = [];

            // geometry
            const particlesGeometry = new THREE.BufferGeometry();
            const count = 50000;
            const positions = new Float32Array(count * 3); // 每个点由三个坐标值组成（x, y, z）
            for (let i = 0; i < count * 3; i += 1) {
                positions[i] = (Math.random() - 0.5) * 5;
            }
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const particles = new THREE.Points(particlesGeometry, pointMaterial);
//            for (let position of particles.geometry.attributes.position) {
//                particles.geometry.attributes.position.setY(positionKey, positionKey * Math.sin(positionKey));
//            }

            scene.add(particles);


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
            controls.zoomSpeed = 0.3;
            // Renderer
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas.value,
            });
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Animations


            console.log(particlesGeometry.attributes.position);
            let time = 0;
            const tick = (elapsedTime = 0) => {
                update();
                time += elapsedTime * 1e-6;
                controls.update();
                pointMaterial.needsUpdate = true;
                for (let i = 0; i < count; i += 1) {
                    particlesGeometry.attributes.position.setY(i, (i%400) * 1e-2 * Math.sin(elapsedTime * 1e-3));
                }
                particlesGeometry.attributes.position.needsUpdate = true;
                // Render
                renderer.render(scene, camera);
//                stats.end();
                requestAnimationFrame(tick);
            };

            tick();

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
