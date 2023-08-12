export type ToolbarEventType =
  | 'default'
  | 'undo'
  | 'redo'
  | 'moving'
  | 'rotation'
  | 'resize'
  | 'deformation'
  | 'mirroring';

export interface ToolbarEvent {
  event: ToolbarEventType;
  entity?: File | string;
}

export enum Tool {
  Frame = 'frame',
  Rotation = 'rotation-point',
  Resize = 'resize-point',
}

export enum ResizeToolPointType {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  LeftCenter = 'left-center',
  RightCenter = 'right-center',
}
