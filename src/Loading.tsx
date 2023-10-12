import {defineComponent, provide, ref, Suspense, Transition, VNode} from "vue";
import {css, cx} from "@emotion/css";
import Loader from './assets/loader.gif';
import 'animate.css';

const loadingAnimation = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #303438;
  z-index: 29;
  text-align: center;
  font-weight: 400;
  color: #fff;
  font-size: 10px;
  transition: clip-path 1s cubic-bezier(0.16, 0.71, 0.79, 0.29);

  .child {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: transparent;

  }

  .icon {
    width: 60px;
    height: 60px;
    margin: auto auto 20px;
    background: url(${Loader}) no-repeat;
    background-size: contain;

  }
`;
const Loading = defineComponent<{
    value: Promise<any>
}>({
    props: {
        value: {
            type: Promise,
        }
    },
    setup(props: {
        value: Promise<any>
    }, cxt: {
        slots: {
            default: (props: { value: any }) => VNode
        },
    }) {
        const isLoading = ref<boolean>();
        const loadedData = ref<any>([]);
        Promise.resolve(props.value).then((res) => {
            loadedData.value = res;
        }).finally(() => isLoading.value = true);
        return () => <>
            {/*<Transition*/}
            {/*    duration={500}*/}
            {/*    enterActiveClass={cx(css`*/}
            {/*      &.loading {*/}
            {/*        //clip-path: circle(100% at 50% 50%);*/}
            {/*      }*/}
            {/*    `)}*/}
            {/*    leaveActiveClass={cx( css`*/}
            {/*      &.loading {*/}
            {/*      }*/}
            {/*    `)}>*/}
            {isLoading.value ?
                cxt.slots.default({
                    value: loadedData.value,
                }) : <div class={cx('loading', loadingAnimation)}>
                    <div class={'child'}>
                        <div class="icon"></div>
                        Wait A Moment...
                    </div>
                </div>
            }
            {/*</Transition>*/}
        </>;
    }
});


export default Loading;
