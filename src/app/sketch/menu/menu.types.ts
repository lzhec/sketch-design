export type MenuEventType =
  | 'add'
  | 'load'
  | 'save'
  | 'export'
  | 'undo'
  | 'redo';

export interface MenuEvent {
  event: MenuEventType;
  entity?: File | string;
}
