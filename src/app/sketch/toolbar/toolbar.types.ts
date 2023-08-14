export enum Tool {
  Frame = 'frame',
  Rotation = 'rotation',
  Resize = 'resize',
  Distortion = 'distortion',
  Mirror = 'mirror',
}

export enum ToolPointType {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  LeftCenter = 'left-center',
  RightCenter = 'right-center',
}

export interface QuickToolEvent {
  tool: Tool;
  type?: MirrorToolType;
}

export type MirrorToolType = 'vertical' | 'horizontal';
