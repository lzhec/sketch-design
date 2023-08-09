import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { ResizeToolPointType, Tool } from '../toolbar/toolbar.types';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('viewport') canvas: ElementRef<HTMLDivElement>;

  @Output() public downloadEvent = new EventEmitter<void>();

  private mousedown$ = new BehaviorSubject<MouseEvent>(null);
  private currentCanvas$ = new BehaviorSubject<HTMLCanvasElement>(null);
  private currentFrame$ = new BehaviorSubject<HTMLDivElement>(null);

  private currentTool: HTMLDivElement;

  public Tool = Tool;
  public ResizeToolPointType = ResizeToolPointType;

  constructor(private state: SketchState) {}

  public ngAfterViewInit(): void {
    fromEvent(this.canvas.nativeElement, 'mousedown')
      .pipe(filter((event) => event['which'] === 1))
      .subscribe((event: MouseEvent) => {
        // console.log('MOUSE DOWN', event);
        const element = event.target as HTMLCanvasElement | HTMLDivElement;

        if (!element.id) {
          return;
        }

        this.mousedown$.next(event);

        const type = element.getAttribute('type');

        if (type) {
          this.selectLayerByFrame(element as HTMLDivElement, type as Tool);
        } else {
          this.selectLayerByCanvas(element as HTMLCanvasElement);
        }
      });
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

  private selectLayerByFrame(element: HTMLDivElement, toolType: Tool): void {
    const canvas = this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
      `[id="${this.state.currentLayer.id}"]`,
    );
    this.currentCanvas$.next(canvas);

    if (toolType !== Tool.Frame) {
      this.currentTool = element;
    }

    switch (toolType) {
      case Tool.Frame:
        // this.listenToMoveCanvas();
        break;

      case Tool.Resize:
        break;
    }

    this.listenToMoveCanvas(toolType, canvas.offsetLeft, canvas.offsetTop);
  }

  private selectLayerByCanvas(canvas: HTMLCanvasElement): void {
    let frame: HTMLDivElement;

    if (!this.state.currentLayer || this.state.currentLayer.id !== canvas.id) {
      if (this.state.currentLayer) {
        const previousFrame = this.canvas.nativeElement.querySelector(
          `[id="${Tool.Frame}-${this.state.currentLayer.id}"]`,
        );

        this.canvas.nativeElement.removeChild(previousFrame);
      }

      this.state.currentLayer = this.state.layers$.value.find(
        (layer) => layer.id === canvas.id,
      );

      frame = document.createElement('div');
      // const coords = this.getCanvasCoords(canvas);

      const tl = document.createElement('div');
      const tr = document.createElement('div');
      const bl = document.createElement('div');
      const br = document.createElement('div');
      const rot = document.createElement('div');

      frame.setAttribute('type', Tool.Frame);
      frame.classList.add(...['app-sketch-frame', 'app-frame-border']);
      frame.id = `${Tool.Frame}-${canvas.id}`;
      // frame.style.left = `${coords.left}px`;
      // frame.style.top = `${coords.top}px`;
      frame.style.left = `${canvas.offsetLeft}px`;
      frame.style.top = `${canvas.offsetTop}px`;
      frame.style.width = `${canvas.width}px`;
      frame.style.height = `${canvas.height}px`;

      tl.style.left = '-10px';
      tl.style.top = '-10px';
      tr.style.left = `${canvas.width - 10}px`;
      tr.style.top = '-30px';
      bl.style.left = '-10px';
      bl.style.top = `${canvas.height - 50}px`;
      br.style.left = `${canvas.width - 10}px`;
      br.style.top = `${canvas.height - 70}px`;

      tl.setAttribute('side', ResizeToolPointType.TopLeft);
      tr.setAttribute('side', ResizeToolPointType.TopRight);
      bl.setAttribute('side', ResizeToolPointType.BottomLeft);
      br.setAttribute('side', ResizeToolPointType.BottomRight);

      const resizePoints = [tl, tr, bl, br];

      resizePoints.forEach((point) => {
        const side = point.getAttribute('side');
        point.id = `${side}-${Tool.Resize}-${canvas.id}`;
        point.classList.add(
          ...['app-sketch-frame-resize-point', 'app-frame-border'],
        );
        point.setAttribute('type', Tool.Resize);
        point.style.width = '20px';
        point.style.height = '20px';

        frame.appendChild(point);
      });

      this.canvas.nativeElement.appendChild(frame);
    } else {
      frame = this.canvas.nativeElement.querySelector(
        `[id="${Tool.Frame}-${canvas.id}"]`,
      );
    }

    this.currentCanvas$.next(canvas);
    this.currentFrame$.next(frame);

    this.listenToMoveCanvas(Tool.Frame, canvas.offsetLeft, canvas.offsetTop);
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
          name: `layer ${this.state.maxLayerIndex}`,
          type: 'image',
          level: this.state.maxLayerIndex,
          data: ctx,
          originalData: originalImg,
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
    toolType: Tool,
    startPositionX: number,
    startPositionY: number,
  ): void {
    const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');
    const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
    const dragStart$ = zip([
      this.mousedown$,
      this.currentCanvas$,
      this.currentFrame$,
    ]).pipe(filter(([event, canvas, frame]) => !!event && !!canvas && !!frame));
    const dragMove$ = dragStart$.pipe(
      switchMap(([event, canvas, frame]) => {
        const coords = this.getCanvasCoords(canvas);

        return mouseMove$.pipe(
          map((moveEvent: MouseEvent) => {
            switch (toolType) {
              case Tool.Frame:
                return {
                  originalEvent: moveEvent,
                  deltaX: moveEvent.pageX - event.pageX + coords.left,
                  deltaY: moveEvent.pageY - event.pageY + coords.top,
                  startOffsetX: event.offsetX,
                  startOffsetY: event.offsetY,
                };

              case Tool.Resize:
                return {
                  originalEvent: moveEvent,
                  deltaX: moveEvent.pageX - coords.left,
                  deltaY: moveEvent.pageY - coords.top,
                  startOffsetX: event.offsetX,
                  startOffsetY: event.offsetY,
                };

              default:
                return {};
            }
          }),
          tap((moveEvent) => {
            switch (toolType) {
              case Tool.Frame:
                canvas.style.left = `${moveEvent.deltaX}px`;
                canvas.style.top = `${moveEvent.deltaY}px`;
                frame.style.left = `${moveEvent.deltaX}px`;
                frame.style.top = `${moveEvent.deltaY}px`;

                break;

              case Tool.Resize:
                const layer = this.state.currentLayer;
                const side = this.currentTool.getAttribute('side');
                const isProportional = true;
                const sizeProportion =
                  layer.originalHeight / layer.originalWidth;

                const tl = frame.querySelector<HTMLDivElement>(
                  `[side=${ResizeToolPointType.TopLeft}]`,
                );
                const tr = frame.querySelector<HTMLDivElement>(
                  `[side=${ResizeToolPointType.TopRight}]`,
                );
                const bl = frame.querySelector<HTMLDivElement>(
                  `[side=${ResizeToolPointType.BottomLeft}]`,
                );
                const br = frame.querySelector<HTMLDivElement>(
                  `[side=${ResizeToolPointType.BottomRight}]`,
                );

                switch (side) {
                  case ResizeToolPointType.TopLeft:
                    if (isProportional) {
                      if (
                        (canvas.width - moveEvent.deltaX) * sizeProportion <
                        canvas.height - moveEvent.deltaY
                      ) {
                        moveEvent.deltaY = moveEvent.deltaX * sizeProportion;
                      } else {
                        moveEvent.deltaX = moveEvent.deltaY / sizeProportion;
                      }
                    }
                    startPositionX = canvas.offsetLeft + moveEvent.deltaX;
                    startPositionY = canvas.offsetTop + moveEvent.deltaY;
                    canvas.width = canvas.width - moveEvent.deltaX;
                    canvas.height = canvas.height - moveEvent.deltaY;
                    break;
                  case ResizeToolPointType.TopRight:
                    if (isProportional) {
                      if (
                        (canvas.width + moveEvent.deltaX) * sizeProportion <
                        canvas.height - moveEvent.deltaY
                      ) {
                        moveEvent.deltaY = -moveEvent.deltaX * sizeProportion;
                      } else {
                        moveEvent.deltaX = -moveEvent.deltaY / sizeProportion;
                      }
                    }
                    startPositionY = canvas.offsetTop + moveEvent.deltaY;
                    canvas.width = canvas.width + moveEvent.deltaX;
                    canvas.height = canvas.height - moveEvent.deltaY;
                    break;
                  case ResizeToolPointType.BottomLeft:
                    if (isProportional) {
                      if (
                        (canvas.width + moveEvent.deltaX) * sizeProportion <
                        canvas.height - moveEvent.deltaY
                      ) {
                        moveEvent.deltaY = -moveEvent.deltaX * sizeProportion;
                      } else {
                        moveEvent.deltaX = -moveEvent.deltaY / sizeProportion;
                      }
                    }
                    startPositionX = canvas.offsetLeft + moveEvent.deltaX;
                    console.log(moveEvent.deltaX);
                    console.log(moveEvent.deltaY);
                    canvas.style.left = `${startPositionX}px`;
                    frame.style.left = `${startPositionX}px`;
                    frame.style.width = `${
                      layer.originalWidth - moveEvent.deltaX
                    }px`;
                    frame.style.height = `${
                      layer.originalHeight + moveEvent.deltaY
                    }px`;
                    // canvas.width = canvas.width - moveEvent.deltaX;
                    // canvas.height = canvas.height + moveEvent.deltaY;

                    break;
                  case ResizeToolPointType.BottomRight:
                    if (isProportional) {
                      if (
                        (canvas.width + moveEvent.deltaX) * sizeProportion <
                        canvas.height + moveEvent.deltaY
                      ) {
                        moveEvent.deltaY = moveEvent.deltaX * sizeProportion;
                      } else {
                        moveEvent.deltaX = moveEvent.deltaY / sizeProportion;
                      }
                    }

                    canvas.width = Math.floor(moveEvent.deltaX);
                    canvas.height = Math.floor(moveEvent.deltaY);
                    frame.style.width = `${Math.floor(moveEvent.deltaX)}px`;
                    frame.style.height = `${Math.floor(moveEvent.deltaY)}px`;

                    tr.style.left = `${canvas.width - 10}px`;
                    tr.style.top = '-30px';
                    bl.style.left = '-10px';
                    bl.style.top = `${canvas.height - 50}px`;
                    br.style.left = `${canvas.width - 10}px`;
                    br.style.top = `${canvas.height - 70}px`;

                    break;
                }

                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                  layer.originalData,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
            }
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
        // tap((event: MoveEvent) => {
        //   console.log('DRAG MOVE', event);
        // }),
        takeUntil(mouseUp$),
      ),
      dragEnd$.pipe(
        first(),
        tap((event: MoveEvent) => {
          console.log('DRAG END', event);

          this.mousedown$.next(null);
          this.currentCanvas$.next(null);
        }),
      ),
    ]).subscribe();
  }
}
