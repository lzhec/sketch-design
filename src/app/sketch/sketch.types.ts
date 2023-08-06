export type SketchEventType = 'add' | 'dnd' | 'delete';

export interface Layer {
  id: string;
  name: string;
  type: string;
  level: number;
  data: CanvasRenderingContext2D;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}
