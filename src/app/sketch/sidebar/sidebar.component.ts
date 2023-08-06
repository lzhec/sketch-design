import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { SketchState } from '../sketch.state';
import { Layer } from '../sketch.types';
import { SidebarEvent } from './sidebar.types';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Output() public sidebarEvent = new EventEmitter<SidebarEvent>();

  constructor(public state: SketchState) {}

  public selectLayer(layer: Layer): void {
    this.sidebarEvent.next({ event: 'layer-select', entity: layer });
  }
}
