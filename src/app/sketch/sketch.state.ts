import { Injectable } from '@angular/core';
import { Layer } from './sketch.types';

@Injectable()
export class SketchState {
  public layers: Layer[] = [];
  public currentLayer = -1;
  public maxLayer = -1;
}
