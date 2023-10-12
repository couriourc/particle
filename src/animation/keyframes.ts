import {keyframes} from "@emotion/css";

export const titleWindKeyframes = keyframes`
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

