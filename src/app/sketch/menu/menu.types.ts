export type MenuEventType = 'add';

export interface MenuEvent {
  event: MenuEventType;
  entity?: File | string;
}
