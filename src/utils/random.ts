export function getRandom(min: number, max: number) {

    return max - (Math.random() * (max - min));
}
