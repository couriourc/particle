type UtilsCanvasAttribute = {
    width: number;
    height: number;
}

export function getUtilsCanvas(attrs: Partial<UtilsCanvasAttribute>): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        canvas.setAttribute(key, value);
    });
    return canvas;
}

export function getImageData() {
    const canvas = getUtilsCanvas({
        width: 1920,
        height: 1080
    });
    const ctx = canvas.getContext('2d', {});

}

export function getTextBitmapData(text: string) {
    const canvas = getUtilsCanvas({
        width: 100,
        height: 100,
    });
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,255,255)';
    ctx.fillText(text, 0, 0,100);
ctx.save();
    return ctx.getImageData(0,0,100,100);
}
