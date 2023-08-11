export type SketchEventType = 'add' | 'dnd' | 'delete';

export interface Layer {
  id: string;
  name: string;
  type: string;
  level: number;
  width: number;
  height: number;
  originalData: HTMLImageElement;
  originalWidth: number;
  originalHeight: number;
  isHidden: boolean;
}
