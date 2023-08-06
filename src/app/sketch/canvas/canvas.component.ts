import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Layer } from '../sketch.types';
import { SketchState } from '../sketch.state';
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
import { SidebarEvent } from '../sidebar/sidebar.types';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('viewport') canvas: ElementRef<HTMLDivElement>;

  private mouseDown$: Observable<Event>;

  constructor(private state: SketchState) {}

  public ngAfterViewInit(): void {
    this.mouseDown$ = fromEvent(this.canvas.nativeElement, 'mousedown');

    this.mouseDown$.subscribe((event: MouseEvent) => {
      console.log('MOUSE DOWN');
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
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    this.listenToMoveCanvas(canvas);
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

        this.state.maxLayer++;

        ctx.drawImage(originalImg, 0, 0);
        layer.style.position = 'absolute';
        layer.style.zIndex = this.state.maxLayer.toString();
        layer.style.overflow = 'auto';
        layer.id = new Date().valueOf().toString();
        this.canvas.nativeElement.appendChild(layer);

        const newLayer: Layer = {
          id: layer.id,
          name: `layer${this.state.maxLayer}`,
          type: 'image',
          level: this.state.maxLayer,
          data: ctx,
          width: originalImg.naturalWidth || originalImg.width,
          height: originalImg.naturalHeight || originalImg.height,
          originalWidth: originalImg.naturalWidth || originalImg.width,
          originalHeight: originalImg.naturalHeight || originalImg.height,
        };

        const layers = this.state.layers$.value;

        layers.push(newLayer);
        this.state.layers$.next(layers);
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

  private listenToMoveCanvas(canvas: HTMLCanvasElement): void {
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
        tap((event: any) => {
          console.log('DRAG MOVE', event);
        }),
      ),
      dragEnd$.pipe(
        tap((event: any) => {
          console.log('DRAG END', event);
        }),
      ),
    ])
      .pipe(takeUntil(mouseUp$))
      .subscribe();
  }
}
