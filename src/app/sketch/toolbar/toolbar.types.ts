export type ToolbarEventType =
  | 'undo'
  | 'redo'
  | 'moving'
  | 'rotation'
  | 'scaling'
  | 'deformation'
  | 'mirroring';

export interface ToolbarEvent {
  event: ToolbarEventType;
  entity?: File | string;
}

export enum Tool {
  Frame = 'frame',
  Rotation = 'rotation',
  Scaling = 'scaling',
}

export enum ScalingToolPointType {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  LeftCenter = 'left-center',
  RightCenter = 'right-center',
}
