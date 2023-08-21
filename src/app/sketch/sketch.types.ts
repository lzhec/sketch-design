export type SketchEventType = 'add' | 'dnd' | 'delete';

export interface Layer {
  id: string;
  name: string;
  type: string;
  level: number;
  width: number;
  height: number;
  data: HTMLImageElement;
  originalData: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
  corners: [number, number][];
  originalCorners: [number, number][];
  isHidden: boolean;
}
