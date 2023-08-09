export type SketchEventType = 'add' | 'dnd' | 'delete';

export interface Layer {
  id: string;
  name: string;
  type: string;
  level: number;
  data: CanvasRenderingContext2D;
  originalData: HTMLImageElement;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}
