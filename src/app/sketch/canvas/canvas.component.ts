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

  public reordeerLayersHandler(predecessor: Layer, follower: Layer): void {
    const predecessorCanvas =
      this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
        `[id="${predecessor.id}"]`,
      );

    const followerCanvas =
      this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
        `[id="${follower.id}"]`,
      );

    predecessorCanvas.style.zIndex = `${predecessor.level}`;
    followerCanvas.style.zIndex = `${follower.level}`;
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
        break;

      case Tool.Resize:
        break;
    }

    this.listenToMoveCanvas(toolType);
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
        frame.appendChild(point);
      });

      rot.id = `${Tool.Rotation}-${canvas.id}`;
      rot.classList.add(
        ...['app-sketch-frame-rotation-point', 'app-frame-border'],
      );
      rot.setAttribute('type', Tool.Rotation);
      frame.appendChild(rot);

      this.canvas.nativeElement.appendChild(frame);
    } else {
      frame = this.canvas.nativeElement.querySelector(
        `[id="${Tool.Frame}-${canvas.id}"]`,
      );
    }

    this.currentCanvas$.next(canvas);
    this.currentFrame$.next(frame);

    this.listenToMoveCanvas(Tool.Frame);
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
          originalData: originalImg,
          width: originalImg.naturalWidth || originalImg.width,
          height: originalImg.naturalHeight || originalImg.height,
          originalWidth: originalImg.naturalWidth || originalImg.width,
          originalHeight: originalImg.naturalHeight || originalImg.height,
          isHidden: false,
        };

        const layers = this.state.layers$.value;

        layers.push(newLayer);
        this.state.layers$.next(layers.sort((a, b) => a.level - b.level));
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

  private listenToMoveCanvas(toolType: Tool): void {
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
        const w = canvas.offsetLeft + canvas.width / 2;
        const h = canvas.offsetTop + canvas.height / 2;
        let ctx: CanvasRenderingContext2D;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        // const originalImg = new Image();
        // originalImg.src = canvas.toDataURL();

        return mouseMove$.pipe(
          map((moveEvent: MouseEvent) => ({
            startEvent: event,
            originalEvent: moveEvent,
            coords: coords,
          })),
          tap((moveEvent) => {
            let deltaX: number;
            let deltaY: number;

            switch (toolType) {
              case Tool.Rotation:
                deltaX = w - moveEvent.originalEvent.pageX;
                deltaY = h - moveEvent.originalEvent.pageY;
                const rad = Math.atan2(deltaY, deltaX);
                let deg = Math.round((rad * 180 - 270) / Math.PI);

                const deltaX2 =
                  -moveEvent.startEvent.offsetX +
                  moveEvent.originalEvent.offsetX;

                const deltaY2 =
                  -moveEvent.startEvent.offsetY +
                  moveEvent.originalEvent.offsetY;

                const rad2 = Math.atan2(deltaY2, deltaX2);

                if (deg < 0) {
                  deg = (deg + 360) % 360;
                }

                frame.style.rotate = `${deg}deg`;
                canvas.style.transform = `rotate(${deg}deg)`;

                // ctx = canvas.getContext('2d');

                // ctx.clearRect(0, 0, canvas.width, canvas.height);
                // ctx.save();
                // ctx.translate(0, 0);
                // ctx.translate(canvas.width / 2, canvas.height / 2);
                // ctx.rotate(rad);
                // ctx.drawImage(
                //   originalImg,
                //   -(originalImg.width / 2),
                //   -(originalImg.height / 2),
                // );
                // ctx.restore();

                break;

              case Tool.Frame:
                deltaX =
                  moveEvent.originalEvent.pageX -
                  moveEvent.startEvent.pageX +
                  moveEvent.coords.left;
                deltaY =
                  moveEvent.originalEvent.pageY -
                  moveEvent.startEvent.pageY +
                  moveEvent.coords.top;

                canvas.style.left = `${deltaX}px`;
                canvas.style.top = `${deltaY}px`;
                frame.style.left = `${deltaX}px`;
                frame.style.top = `${deltaY}px`;

                break;

              case Tool.Resize:
                const stopSignal = canvas.width <= 10 || canvas.height <= 10;

                const layer = this.state.currentLayer;
                const side = this.currentTool.getAttribute('side');
                const isProportional = true;
                const sizeProportion =
                  layer.originalHeight / layer.originalWidth;

                switch (side) {
                  case ResizeToolPointType.TopLeft:
                    deltaX =
                      moveEvent.originalEvent.pageX -
                      moveEvent.startEvent.pageX;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;

                    console.log(
                      ResizeToolPointType.TopLeft,
                      deltaX,
                      deltaY,
                      stopSignal,
                    );

                    if (deltaX >= 0 && stopSignal) {
                      console.log('STOP');
                      return;
                    }

                    if (isProportional) {
                      if (
                        (canvas.width - deltaX) * sizeProportion <
                        canvas.height - deltaY
                      ) {
                        deltaY = deltaX * sizeProportion;
                      } else {
                        deltaX = deltaY / sizeProportion;
                      }
                    }

                    frame.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    frame.style.top = `${Math.floor(event.clientY + deltaY)}px`;
                    frame.style.width = `${Math.floor(canvasWidth - deltaX)}px`;
                    frame.style.height = `${Math.floor(
                      canvasHeight - deltaY,
                    )}px`;
                    canvas.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    canvas.style.top = `${Math.floor(
                      event.clientY + deltaY,
                    )}px`;
                    canvas.width = Math.floor(canvasWidth - deltaX);
                    canvas.height = Math.floor(canvasHeight - deltaY);

                    break;

                  case ResizeToolPointType.TopRight:
                    deltaX =
                      moveEvent.originalEvent.pageX - moveEvent.coords.left;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;

                    if (deltaY > 0 && stopSignal) {
                      return;
                    }

                    if (isProportional) {
                      if (
                        (canvas.width + deltaX) * sizeProportion <
                        canvas.height - deltaY
                      ) {
                        deltaY = -deltaX * sizeProportion;
                      } else {
                        deltaX = -deltaY / sizeProportion;
                      }
                    }

                    frame.style.top = `${event.clientY + deltaY}px`;
                    frame.style.width = `${Math.floor(canvasWidth + deltaX)}px`;
                    frame.style.height = `${Math.floor(
                      canvasHeight - deltaY,
                    )}px`;
                    canvas.style.top = `${event.clientY + deltaY}px`;
                    canvas.width = Math.floor(canvasWidth + deltaX);
                    canvas.height = Math.floor(
                      Math.floor(canvasHeight - deltaY),
                    );

                    break;

                  case ResizeToolPointType.BottomLeft:
                    deltaX =
                      moveEvent.originalEvent.pageX -
                      moveEvent.startEvent.pageX;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;

                    if (deltaX >= 0 && stopSignal) {
                      return;
                    }

                    if (isProportional) {
                      if (
                        (canvas.width + deltaX) * sizeProportion <
                        canvas.height - deltaY
                      ) {
                        deltaY = -deltaX * sizeProportion;
                      } else {
                        deltaX = -deltaY / sizeProportion;
                      }
                    }

                    frame.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    frame.style.width = `${Math.floor(canvasWidth - deltaX)}px`;
                    frame.style.height = `${Math.floor(
                      canvasHeight + deltaY,
                    )}px`;
                    canvas.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    canvas.width = Math.floor(canvasWidth - deltaX);
                    canvas.height = Math.floor(canvasHeight + deltaY);

                    break;

                  case ResizeToolPointType.BottomRight:
                    deltaX =
                      moveEvent.originalEvent.pageX - moveEvent.coords.left;
                    deltaY =
                      moveEvent.originalEvent.pageY - moveEvent.coords.top;

                    if (isProportional) {
                      if (
                        (canvas.width +
                          moveEvent.originalEvent.pageX +
                          deltaX) *
                          sizeProportion <
                        canvas.height + deltaY
                      ) {
                        deltaY = deltaX * sizeProportion;
                      } else {
                        deltaX = deltaY / sizeProportion;
                      }
                    }

                    frame.style.width = `${Math.floor(deltaX)}px`;
                    frame.style.height = `${Math.floor(deltaY)}px`;
                    canvas.width = Math.floor(deltaX);
                    canvas.height = Math.floor(deltaY);

                    break;
                }

                ctx = canvas.getContext('2d');

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
        // tap((event) => {
        //   console.log('START DRAG', event);
        // }),
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
        tap((event) => {
          // console.log('DRAG END', event);

          this.mousedown$.next(null);
          this.currentCanvas$.next(null);
        }),
      ),
    ]).subscribe();
  }
}
