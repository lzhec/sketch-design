import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  first,
  fromEvent,
  last,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
  zip,
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

  private currentMousedown$ = new BehaviorSubject<any>(null);
  private currentCanvas$ = new BehaviorSubject<HTMLCanvasElement>(null);
  private currentFrame$ = new BehaviorSubject<HTMLDivElement>(null);

  constructor(private state: SketchState) {}

  public ngAfterViewInit(): void {
    fromEvent(this.canvas.nativeElement, 'mousedown').subscribe(
      (event: MouseEvent) => {
        console.log('MOUSE DOWN', event);
        const element = event.target as HTMLCanvasElement | HTMLDivElement;

        if (!element.id) {
          return;
        }

        this.currentMousedown$.next(event);

        element.hasAttribute('sketch-frame')
          ? this.selectLayerByFrame(element as HTMLDivElement)
          : this.selectLayerByCanvas(element as HTMLCanvasElement);
      },
    );
  }

  public selectLayerHandler(layer: Layer): void {
    const canvas = this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
      `[id="${layer.id}"]`,
    );

    if (!canvas) {
      return;
    }

    this.selectLayerByCanvas(canvas);
  }

  private selectLayerByFrame(frame: HTMLDivElement): void {
    this.currentCanvas$.next(
      this.canvas.nativeElement.querySelector(
        `[id="${this.state.currentLayer.id}"]`,
      ),
    );
    this.listenToMoveCanvas();
  }

  private selectLayerByCanvas(canvas: HTMLCanvasElement): void {
    let frame: HTMLDivElement;

    if (!this.state.currentLayer || this.state.currentLayer.id !== canvas.id) {
      if (this.state.currentLayer) {
        const previousFrame = this.canvas.nativeElement.querySelector(
          `[id="sketch-frame-${this.state.currentLayer.id}"]`,
        );

        this.canvas.nativeElement.removeChild(previousFrame);
      }

      this.state.currentLayer = this.state.layers$.value.find(
        (layer) => layer.id === canvas.id,
      );

      frame = document.createElement('div');

      frame.setAttribute('sketch-frame', 'true');
      frame.id = `sketch-frame-${canvas.id}`;
      frame.style.left = `${canvas.offsetLeft}px`;
      frame.style.top = `${canvas.offsetTop}px`;
      frame.style.width = `${canvas.width}px`;
      frame.style.height = `${canvas.height}px`;
      frame.style.position = 'absolute';
      frame.style.zIndex = '999';
      frame.style.border = 'red 3px solid';
      // frame.style.pointerEvents = 'none';

      this.canvas.nativeElement.appendChild(frame);
    } else {
      frame = this.canvas.nativeElement.querySelector(
        `[id="sketch-frame-${canvas.id}"]`,
      );
    }

    this.currentCanvas$.next(canvas);
    this.currentFrame$.next(frame);

    this.listenToMoveCanvas();
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

  private listenToMoveCanvas(): void {
    const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');
    const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
    const dragStart$ = zip([
      this.currentMousedown$,
      this.currentCanvas$,
      this.currentFrame$,
    ]).pipe(filter(([event, canvas, frame]) => !!event && !!canvas && !!frame));
    const dragMove$ = dragStart$.pipe(
      switchMap(([event, canvas, frame]) => {
        const coords = this.getCanvasCoords(canvas);

        return mouseMove$.pipe(
          map((moveEvent: MouseEvent) => {
            return {
              originalEvent: moveEvent,
              deltaX: moveEvent.pageX - event.pageX + coords.left,
              deltaY: moveEvent.pageY - event.pageY + coords.top,
              startOffsetX: event.offsetX,
              startOffsetY: event.offsetY,
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
      switchMap(([event, frame]) =>
        mouseMove$.pipe(
          startWith(event),
          map((moveEvent: MouseEvent) => ({
            originalEvent: moveEvent,
            deltaX: moveEvent.pageX - event.pageX,
            deltaY: moveEvent.pageY - event.pageY,
            startOffsetX: event.offsetX,
            startOffsetY: event.offsetY,
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
        takeUntil(mouseUp$),
      ),
      dragMove$.pipe(
        tap((event: MoveEvent) => {
          console.log('DRAG MOVE', event);
        }),
        takeUntil(mouseUp$),
      ),
      dragEnd$.pipe(
        first(),
        tap((event: MoveEvent) => {
          console.log('DRAG END', event);
          const canvas = event.originalEvent.target as HTMLCanvasElement;

          if (!canvas.id) {
            return;
          }

          this.currentMousedown$.next(null);
          this.currentCanvas$.next(null);
        }),
      ),
    ]).subscribe();
  }
}
