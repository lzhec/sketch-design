import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import {
  Observable,
  combineLatest,
  fromEvent,
  last,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Layer } from '../sketch.types';
import { SketchState } from '../sketch.state';
import { MoveEvent } from './canvas.types';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('viewport') canvas: ElementRef<HTMLDivElement>;

  @Output() public downloadEvent = new EventEmitter<void>();

  private mouseDown$: Observable<Event>;

  constructor(private state: SketchState) {}

  public ngAfterViewInit(): void {
    this.mouseDown$ = fromEvent(this.canvas.nativeElement, 'mousedown');

    this.mouseDown$.subscribe((event: MouseEvent) => {
      console.log('MOUSE DOWN', event);
      const canvas = event.target as HTMLCanvasElement;

      if (!canvas.id) {
        return;
      }

      this.selectLayer(canvas);
    });
  }

  public selectLayerHandler(layer: Layer): void {
    const canvas = this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
      `[id="${layer.id}"]`,
    );

    if (!canvas) {
      return;
    }

    this.selectLayer(canvas);
  }

  public selectLayer(canvas: HTMLCanvasElement): void {
    let frame: HTMLDivElement;

    if (!this.state.currentLayer || this.state.currentLayer.id !== canvas.id) {
      this.state.currentLayer = this.state.layers$.value.find(
        (layer) => layer.id === canvas.id,
      );

      frame = document.createElement('div');
      frame.id = `sketch-frame-${canvas.id}`;
      frame.style.left = `${canvas.offsetLeft}px`;
      frame.style.top = `${canvas.offsetTop}px`;
      frame.style.width = `${canvas.width}px`;
      frame.style.height = `${canvas.height}px`;
      frame.style.position = 'absolute';
      frame.style.zIndex = '999';
      frame.style.border = 'red 3px solid';
      frame.style.pointerEvents = 'none';

      this.canvas.nativeElement.appendChild(frame);
    } else {
      frame = this.canvas.nativeElement.querySelector(
        `[id="sketch-frame-${canvas.id}"]`,
      );
    }

    this.listenToMoveCanvas(canvas, frame);
  }

  public createLayer(img: HTMLImageElement): HTMLCanvasElement {
    const layer = document.createElement('canvas');
    layer.width = img.width > 800 ? 800 : img.width;
    layer.height = img.height > 600 ? 600 : img.height;

    return layer;
  }

  public drawLayer(context: CanvasRenderingContext2D, layer: any): void {
    context.drawImage(layer.canvas, 0, 0);
  }

  public addImage(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      let originalImg = new Image();
      originalImg.src = e.target.result;

      originalImg.onload = () => {
        const layer = this.createLayer(originalImg);
        const ctx = layer.getContext('2d');

        this.state.maxLayerIndex++;

        ctx.drawImage(originalImg, 0, 0);
        layer.style.position = 'absolute';
        layer.style.zIndex = this.state.maxLayerIndex.toString();
        layer.style.overflow = 'auto';
        layer.id = new Date().valueOf().toString();
        this.canvas.nativeElement.appendChild(layer);

        const newLayer: Layer = {
          id: layer.id,
          name: `layer${this.state.maxLayerIndex}`,
          type: 'image',
          level: this.state.maxLayerIndex,
          data: ctx,
          width: originalImg.naturalWidth || originalImg.width,
          height: originalImg.naturalHeight || originalImg.height,
          originalWidth: originalImg.naturalWidth || originalImg.width,
          originalHeight: originalImg.naturalHeight || originalImg.height,
        };

        const layers = this.state.layers$.value;

        layers.push(newLayer);
        this.state.layers$.next(layers);
        this.downloadEvent.next();
      };
    };
    reader.readAsDataURL(file);
  }

  private getCanvasCoords(canvas: HTMLCanvasElement): {
    top: number;
    left: number;
  } {
    const box = canvas.getBoundingClientRect();

    return {
      top: box.top + pageYOffset,
      left: box.left + pageXOffset,
    };
  }

  private listenToMoveCanvas(
    canvas: HTMLCanvasElement,
    frame: HTMLDivElement,
  ): void {
    const mouseMove$: Observable<Event> = fromEvent(canvas, 'mousemove');
    const mouseUp$: Observable<Event> = fromEvent(canvas, 'mouseup');
    const dragStart$ = this.mouseDown$;
    const dragMove$ = dragStart$.pipe(
      switchMap((start: MouseEvent) => {
        const coords = this.getCanvasCoords(canvas);

        return mouseMove$.pipe(
          map((moveEvent: MouseEvent) => {
            return {
              originalEvent: moveEvent,
              deltaX: moveEvent.pageX - start.pageX + coords.left,
              deltaY: moveEvent.pageY - start.pageY + coords.top,
              startOffsetX: start.offsetX,
              startOffsetY: start.offsetY,
            };
          }),
          tap((moveEvent) => {
            canvas.style.left = `${moveEvent.deltaX}px`;
            canvas.style.top = `${moveEvent.deltaY}px`;
            frame.style.left = `${moveEvent.deltaX}px`;
            frame.style.top = `${moveEvent.deltaY}px`;
          }),
          takeUntil(mouseUp$),
        );
      }),
    );
    const dragEnd$ = dragStart$.pipe(
      switchMap((start: MouseEvent) =>
        mouseMove$.pipe(
          startWith(start),
          map((moveEvent: MouseEvent) => ({
            originalEvent: moveEvent,
            deltaX: moveEvent.pageX - start.pageX,
            deltaY: moveEvent.pageY - start.pageY,
            startOffsetX: start.offsetX,
            startOffsetY: start.offsetY,
          })),
          takeUntil(mouseUp$),
          last(),
        ),
      ),
    );

    combineLatest([
      dragStart$.pipe(
        tap((event) => {
          console.log('START DRAG', event);
        }),
      ),
      dragMove$.pipe(
        tap((event: MoveEvent) => {
          console.log('DRAG MOVE', event);
        }),
      ),
      dragEnd$.pipe(
        tap((event: MoveEvent) => {
          console.log('DRAG END', event);
          const canvas = event.originalEvent.target as HTMLCanvasElement;

          if (!canvas.id) {
            return;
          }
        }),
      ),
    ])
      // .pipe(takeUntil(mouseUp$))
      .subscribe();
  }
}
