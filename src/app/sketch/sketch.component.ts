import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ToolbarEvent } from './toolbar/toolbar.types';
import { CanvasComponent } from './canvas/canvas.component';
import { SketchState } from './sketch.state';
import { SidebarEvent } from './sidebar/sidebar.types';
import { Layer } from './sketch.types';
import { MenuEvent } from './menu/menu.types';

@Component({
  selector: 'app-sketch',
  templateUrl: './sketch.component.html',
  styleUrls: ['./sketch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SketchComponent {
  @ViewChild(CanvasComponent) private canvasComponent: CanvasComponent;

  constructor(public state: SketchState) {}

  public menuEventHandler(event: MenuEvent): void {
    switch (event.event) {
      case 'add':
        this.canvasComponent.addImage(event.entity as File);
        break;
    }
  }

  public sidebarEventHandler(event: SidebarEvent): void {
    switch (event.event) {
      case 'layer-select':
        this.canvasComponent.selectLayerHandler(event.entity as Layer);
        break;

      case 'layer-reorder':
        this.canvasComponent.reordeerLayersHandler(
          event.entity[0],
          event.entity[1],
        );
    }
  }
}
