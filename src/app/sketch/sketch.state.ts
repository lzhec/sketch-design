import { Injectable } from '@angular/core';
import { Layer } from './sketch.types';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SketchState {
  public layers$ = new BehaviorSubject<Layer[]>([]);
  public currentLayer = -1;
  public maxLayer = -1;
}
