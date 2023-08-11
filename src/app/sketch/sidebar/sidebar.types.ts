import { Layer } from '../sketch.types';

export type SidebarEventType =
  | 'layer-select'
  | 'layer-hidden'
  | 'layer-reorder';

export interface SidebarEvent {
  event: SidebarEventType;
  entity: Layer | Layer[];
}
