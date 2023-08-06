import { Component, ViewChild } from '@angular/core';
import { ToolbarEvent } from './toolbar/toolbar.types';
import { CanvasComponent } from './canvas/canvas.component';
import { SketchState } from './sketch.state';
import { SidebarEvent } from './sidebar/sidebar.types';
import { Layer } from './sketch.types';

@Component({
  selector: 'app-sketch',
  templateUrl: './sketch.component.html',
  styleUrls: ['./sketch.component.scss'],
})
export class SketchComponent {
  @ViewChild(CanvasComponent) private canvasComponent: CanvasComponent;

  constructor(public state: SketchState) {}

  public toolbarEventHandler(event: ToolbarEvent): void {
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
    }
  }
}
