import { Injectable } from '@angular/core';
import { Layer } from './sketch.types';
import { BehaviorSubject } from 'rxjs';
import { ToolbarEventType } from './toolbar/toolbar.types';

@Injectable()
export class SketchState {
  public layers$ = new BehaviorSubject<Layer[]>([]);
  public currentTool$ = new BehaviorSubject<ToolbarEventType>('default');
  public currentTool: ToolbarEventType = 'default';
  public currentLayer: Layer;
  public currentLayerIndex = -1;
  public maxLayerIndex = -1;
}
