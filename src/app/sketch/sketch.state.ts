import { Injectable } from '@angular/core';
import { Layer } from './sketch.types';

@Injectable()
export class SketchState {
  public layers: Layer[] = [];
}
