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

  public trackByFn<Layers>(index: number, layer: Layer): void {
    // const layers: Layer[] = this.state.layers$.value;
    // const tempLayer = { ...layer };
    // let predecessor = layers[index - 1];
    // let follower = layers[index + 1];
    // if (follower && layer.level > follower.level) {
    //   layer = { ...follower };
    //   follower = { ...tempLayer };
    // } else if (predecessor && layer.level < predecessor.level) {
    //   layer = { ...predecessor };
    //   predecessor = { ...tempLayer };
    // }
    // this.state.layers$.next(layers);
  }

  public selectLayer(layer: Layer): void {
    this.sidebarEvent.next({ event: 'layer-select', entity: layer });
  }

  public onReorderClick(predecessor: Layer, follower: Layer): void {
    const predecessorLevel = predecessor.level;
    predecessor.level = follower.level;
    follower.level = predecessorLevel;

    this.sidebarEvent.next({
      event: 'layer-reorder',
      entity: [predecessor, follower],
    });
  }
}
