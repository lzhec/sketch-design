export type ToolbarEventType =
  | 'undo'
  | 'redo'
  | 'rotation'
  | 'scaling'
  | 'deformation'
  | 'mirroring'
  | 'add';

export interface ToolbarEvent {
  event: ToolbarEventType;
  file?: File;
}
