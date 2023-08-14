import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Layer } from './sketch.types';
import { Tool } from './toolbar/toolbar.types';

@Injectable()
export class SketchState {
  public layers$ = new BehaviorSubject<Layer[]>([]);
  public currentTool$ = new BehaviorSubject<Tool>(Tool.Resize);
  public currentLayer: Layer;
  public currentLayerIndex = -1;
  public maxLayerIndex = -1;
}
