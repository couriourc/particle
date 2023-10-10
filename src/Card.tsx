import {defineComponent, ref, Transition, TransitionGroup} from "vue";
import {css, cx} from "@emotion/css";
import 'animate.css';

export default defineComponent({
    setup() {
        const isShow = ref(false);
        return () => <section class={cx('w-full h-100vh', `flex`, 'justify-center items-center')}>
            <section
                class={cx(`w-120px h-200px border-solid border-1px drop-shadow `, css`
                  transition: width 1s;
                  overflow: hidden;
                  border-radius: 12px;
                  position: relative;
                  white-space: nowrap;

                  &.open {
                    width: 280px;
                  }

                  .detail {
                    transition: width 500s;

                    width: 0;
                    overflow: hidden;
                  }

                  &.open .detail {
                    width: inherit;
                  }

                  .card-preference {
                    position: absolute;
                    height: inherit;
                    background: #2c3e50;
                    color: white;
                    transition: background 1s, width 1s, height 1s, top 1s, left 1s;
                    width: 100%;
                    right: 0;
                    cursor: pointer;

                    .title {
                      position: absolute;
                      transition: background 1s, color 1s, top 1s, left 1s, transform 1s;
                      transition-timing-function: cubic-bezier(0.54, -0.02, 0.63, 0.89);
                      right: 50%;
                      top: 0;
                      transform: translate(50%, 0);
                    }
                  }

                  &.open .card-preference {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    height: inherit;
                    width: 100px;
                    transform: translate(0, -50%);

                    .title {
                      position: absolute;
                      color: white;
                      right: 50%;
                      top: 50%;
                      transition: background 1s, color 1s, top 1s, left 1s, transform 1s;
                      transform: translate(50%, -50%);
                    }
                  }

                `, {
                    'open': isShow.value
                })}>

                <Transition leaveActiveClass={'leave'} duration={500}>

                    <div v-show={isShow.value}
                         class={
                             cx('detail', 'h-200px inline-block',
                                 'flex items-center justify-center flex-col',
                                 css`
                                   .animated {
                                     animation-name: fadeInUp;
                                     animation-duration: 500ms;
                                     animation-fill-mode: both;
                                     animation-delay: var(--animation-delay, 0ms);
                                     animation-timing-function: cubic-bezier(0.54, -0.02, 0.63, 0.89);
                                   }

                                   &.leave{
                                     position: absolute;
                                   }
                                   
                                   &.leave .animated {
                                     animation-name: slideOutDown;
                                     animation-delay: calc(var(--animation-delay, 0ms) * -1);
                                   }
                                 `
                             )}
                    >
                        <div class={cx('animated')} style={
                            {
                                '--animation-delay': '250ms'
                            }
                        }>组织
                        </div>
                        <div class={cx('animated')} style={
                            {
                                '--animation-delay': '400ms'
                            }
                        }>其他内容2
                        </div>
                    </div>
                </Transition>


                <div class={cx('card-preference', 'text-center')}
                     onClick={() => isShow.value = !isShow.value}>
                    {/*外在表现部分*/}
                    <span class={cx('title', 'p-2')}>新闻标题</span>
                </div>
            </section>
        </section>;
    }
});
