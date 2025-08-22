declare module 'pdf417-generator' {
  /**
   * Draw PDF417 barcode onto provided canvas.
   * @param code HUB3 payload or arbitrary string
   * @param canvas HTMLCanvasElement (or node-canvas in Node)
   * @param aspectRatio width:height of the symbol (default 2)
   * @param ecl error correction level 0-8 (default -1 for auto)
   * @param devicePixelRatio extra pixel density for sharpness
   */
  export function draw(
    code: string,
    canvas: HTMLCanvasElement | any,
    aspectRatio?: number,
    ecl?: number,
    devicePixelRatio?: number
  ): void;
}
