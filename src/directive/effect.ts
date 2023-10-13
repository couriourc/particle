import type {App, Directive} from "vue";
import './card.css';

export const VEffect: Directive = {
    mounted(el) {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect(),
                x = e.clientX - rect.left,
                y = e.clientY - rect.top;
            el.style.setProperty("--mouse-x", `${x}px`);
            el.style.setProperty("--mouse-y", `${y}px`);
        });
    }
};
export default (app: App) => app.directive('v-effect', VEffect);
