/**
 * Minimal typings for the parts of PDFKit used by `src/lib/quote-pdf.ts`.
 * PDFKit 0.20 ships no type declarations; this covers only the calls we make, so a typo is still a type error.
 */
declare module 'pdfkit' {
  type Color = string;
  interface TextOptions {
    width?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    lineGap?: number;
    characterSpacing?: number;
    lineBreak?: boolean;
    height?: number;
    ellipsis?: boolean | string;
    link?: string;
    underline?: boolean;
  }
  interface DocumentOptions {
    size?: string | [number, number];
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    font?: string | null;
    autoFirstPage?: boolean;
    lang?: string;
    displayTitle?: boolean;
    info?: Record<string, string | Date>;
  }
  export class PDFDocument {
    constructor(options?: DocumentOptions);
    page: { width: number; height: number };
    x: number;
    y: number;
    addPage(options?: DocumentOptions): this;
    registerFont(name: string, src: Uint8Array | ArrayBuffer, family?: string): this;
    font(name: string, size?: number): this;
    fontSize(size: number): this;
    fillColor(color: Color, opacity?: number): this;
    strokeColor(color: Color, opacity?: number): this;
    fillOpacity(o: number): this;
    strokeOpacity(o: number): this;
    opacity(o: number): this;
    lineWidth(w: number): this;
    lineCap(c: 'butt' | 'round' | 'square'): this;
    lineJoin(j: 'miter' | 'round' | 'bevel'): this;
    save(): this;
    restore(): this;
    translate(x: number, y: number): this;
    scale(x: number, y?: number): this;
    rotate(angle: number, options?: { origin?: [number, number] }): this;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): this;
    rect(x: number, y: number, w: number, h: number): this;
    circle(x: number, y: number, r: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this;
    path(svg: string): this;
    fill(color?: Color): this;
    stroke(color?: Color): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    heightOfString(text: string, options?: TextOptions): number;
    widthOfString(text: string, options?: TextOptions): number;
    end(): void;
  }
  export default PDFDocument;
}

declare module 'pdfkit/output' {
  import type { PDFDocument } from 'pdfkit';
  export function toBlob(doc: PDFDocument): Promise<Blob>;
  export function toBytes(doc: PDFDocument): Promise<Uint8Array>;
}
