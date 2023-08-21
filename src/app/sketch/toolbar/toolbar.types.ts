export enum Tool {
  WrapFrame = 'wrap-frame',
  Rotation = 'rotation',
  Resize = 'resize',
  Wrap = 'wrap',
  Flip = 'flip',
  Movement = 'movement',
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
  Center = 'center',
}

export interface QuickToolEvent {
  tool: Tool;
  type?: FlipToolType;
}

export type FlipToolType = 'vertical' | 'horizontal';
