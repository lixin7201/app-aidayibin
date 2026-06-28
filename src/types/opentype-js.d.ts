declare module "opentype.js" {
  export type OpenTypePath = {
    toPathData(decimalPlaces?: number): string;
  };

  export type OpenTypeFont = {
    getAdvanceWidth(text: string, fontSize: number): number;
    getPath(
      text: string,
      x: number,
      y: number,
      fontSize: number,
    ): OpenTypePath;
  };

  export function parse(buffer: ArrayBuffer): OpenTypeFont;
}
