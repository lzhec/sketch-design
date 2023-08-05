export type SketchEventType = 'add' | 'dnd' | 'delete';

export interface Layer {
  name: string;
  type: string;
  data: CanvasRenderingContext2D;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}
