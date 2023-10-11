import {defineComponent, onMounted, ref} from "vue";
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';
import {Easing, Interpolation, Tween, update} from "@tweenjs/tween.js";
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {Color} from "three";

export default defineComponent({
    setup() {
        const canvas = ref<Element>();
        const scene = new THREE.Scene();
        scene.background = new Color('#060615');
        onMounted(() => {


            // material
            const pointMaterial = new THREE.PointsMaterial({
                size: 0.01,
                sizeAttenuation: true,
            });

            const gList: Float32Array[] = [];

            const particlesGeometry = new THREE.BufferGeometry();

            function gen(count = 5000) {
                const positions = new Float32Array(count * 3); // 每个点由三个坐标值组成（x, y, z）
                for (let i = 0; i < count * 3; i += 3) {
                    positions[i] = Math.sin(((Math.random() * 2) * Math.PI));
                    positions[i + 1] = Math.cos(((Math.random() * 2) * Math.PI));
                    positions[i + 2] = (Math.random() - 0.5) * (Math.random() * 2) * Math.PI;
                }
                return positions;
            }

            function genA(count = 5000) {
                const positions = new Float32Array(count * 3); // 每个点由三个坐标值组成（x, y, z）
                for (let i = 0; i < count * 3; i += 3) {
                    positions[i] = Math.cos(((Math.random() * 2) * Math.PI));
                    positions[i + 1] = (Math.random() - 0.5) * Math.sin(((Math.random() * 2) * Math.PI));
                    positions[i + 2] = (Math.random() - 0.5) * (Math.random() * 2) * Math.PI;
                }
                return positions;
            }

            function genB(count = 5000) {
                const positions = new Float32Array(count * 3); // 每个点由三个坐标值组成（x, y, z）
                for (let i = 0; i < count * 3; i += 3) {
                    positions[i] = Math.random() * 2;
                    positions[i + 1] = (Math.random() - 0.5) * 2;
                    positions[i + 2] = (Math.random() - 0.5);
                }
                return positions;
            }

            gList.push(gen(), genA(), genB());

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(gList[0], 3));
            const particles = new THREE.Points(particlesGeometry, pointMaterial);

            scene.add(particles);

            /*toggle*/
            const toggle = (i: number) =>
                new Tween(
                    particlesGeometry.attributes.position.array
                )
                    .interpolation(Interpolation.Bezier)
                    .to(gList[i])
                    .onUpdate(function () {
                        pointMaterial.needsUpdate = true;
                        particlesGeometry.attributes.position.needsUpdate = true;
                    })
                    .duration(1000)
                    .onComplete(() => {
                        toggle((i + 1) % (gList.length));
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

            /*FIlter*/
            const renderScene = new RenderPass(scene, camera);

            // 后期处理效果，省略N多参数
            const bloomPass = new UnrealBloomPass();
            bloomPass.renderToScreen = true;
            bloomPass.threshold = 0;
            bloomPass.strength = 0.7;
            bloomPass.radius = 0.5;
            bloomPass.light = 1;

            const composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);
            // Animations
            const tick = (time: number) => {
                update();
                controls.update(time);
                composer.render();
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
