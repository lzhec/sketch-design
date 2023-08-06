import { Layer } from '../sketch.types';

export type SidebarEventType = 'layer-select';

export interface SidebarEvent {
  event: SidebarEventType;
  entity: Layer | string;
}
