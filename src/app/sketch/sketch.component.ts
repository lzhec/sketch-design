import { Component, ViewChild } from '@angular/core';
import { ToolbarEvent } from './toolbar/toolbar.types';
import { CanvasComponent } from './canvas/canvas.component';

@Component({
  selector: 'app-sketch',
  templateUrl: './sketch.component.html',
  styleUrls: ['./sketch.component.scss'],
})
export class SketchComponent {
  @ViewChild(CanvasComponent) private canvasComponent: CanvasComponent;

  constructor() {}

  public toolbarEventHandler(event: ToolbarEvent): void {
    switch (event.event) {
      case 'add':
        this.canvasComponent.addImage(event.file);
        break;
    }
  }
}
