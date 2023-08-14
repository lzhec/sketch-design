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
import {
  ToolPointType,
  Tool,
  QuickToolEvent,
  MirrorToolType,
} from '../toolbar/toolbar.types';
import { BaseObject } from '@shared/base/base-object';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent extends BaseObject implements AfterViewInit {
  @ViewChild('viewport') canvas: ElementRef<HTMLDivElement>;

  @Output() public downloadEvent = new EventEmitter<void>();

  private mousedown$ = new BehaviorSubject<MouseEvent>(null);
  public currentCanvas$ = new BehaviorSubject<HTMLCanvasElement>(null);
  public currentCanvasRect$ = new BehaviorSubject<DOMRect>(null);

  public currentTool: Tool;
  private currentToolElement: HTMLDivElement;

  public Tool = Tool;
  public ToolPointType = ToolPointType;

  constructor(public state: SketchState) {
    super();

    this.state.currentTool$.pipe(takeUntil(this.destroy$)).subscribe((tool) => {
      // switch (event) {
      //   case 'default':
      //   case 'move':
      //   case 'resize'
      // }
      // const tools: NodeListOf<HTMLDivElement> = this.getTools();
      // tools.forEach((tool) => {
      //   const attribute = tool.getAttribute('tool');
      // });
    });
  }

  public ngAfterViewInit(): void {
    fromEvent(this.canvas.nativeElement, 'mousedown')
      .pipe(filter((event) => event['which'] === 1))
      .subscribe((event: MouseEvent) => {
        // console.log('MOUSE DOWN', event);
        const element = event.target as HTMLCanvasElement | HTMLDivElement;

        if (!element.id) {
          this.currentCanvas$.next(null);
          this.currentCanvasRect$.next(null);

          return;
        }

        this.mousedown$.next(event);

        const tool = element.getAttribute('tool') as Tool;

        if (tool) {
          this.selectLayerByFrame(element as HTMLDivElement, tool);
        } else {
          this.selectLayerByCanvas(element as HTMLCanvasElement);
        }
      });
  }

  private mirrorCanvas(type: MirrorToolType): void {
    const canvas = this.currentCanvas$.value;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    img.src = canvas.toDataURL();

    img.onload = () => {
      ctx.save();

      if (type === 'horizontal') {
        ctx.translate(Math.floor(canvas.width / 2), 0);
        ctx.scale(-1, 1);
        ctx.translate(-Math.floor(canvas.width / 2), 0);

        // ctx.translate(0, 0);
        // ctx.translate(canvas.width / 2, canvas.height / 2);
        // console.log(+canvas.style.rotate.replace('deg', '') * Math.PI);
        // ctx.rotate((180 - +canvas.style.rotate.replace('deg', '')) * Math.PI);
      } else {
        ctx.translate(0, Math.floor(canvas.height / 2));
        ctx.scale(1, -1);
        ctx.translate(0, -Math.floor(canvas.height / 2));
      }

      ctx.drawImage(img, 0, 0);
      // ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
  }

  public toolbarQuickEventHandler(event: QuickToolEvent): void {
    switch (event.tool) {
      case 'mirror':
        this.mirrorCanvas(event.type);
    }
  }

  public reorderLayersHandler(predecessor: Layer, follower: Layer): void {
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

  private getTools(): NodeListOf<HTMLDivElement> {
    return this.canvas.nativeElement.querySelectorAll<HTMLDivElement>('[tool]');
  }

  private selectLayerByFrame(element: HTMLDivElement, tool: Tool): void {
    // const canvas = this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
    //   `[id="${this.state.currentLayer.id}"]`,
    // );

    this.state.currentTool$.next(tool);
    this.currentToolElement = element;

    this.listenToMoveCanvas(tool);
  }

  private selectLayerByCanvas(canvas: HTMLCanvasElement): void {
    const frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
      `[tool="${Tool.Frame}"]`,
    );

    frame.style.rotate = '0deg';

    if (!this.state.currentLayer || this.state.currentLayer.id !== canvas.id) {
      this.state.currentLayer = this.state.layers$.value.find(
        (layer) => layer.id === canvas.id,
      );
    }

    let canvasRect = canvas.getBoundingClientRect();

    frame.style.left = `${canvasRect.left}px`;
    frame.style.top = `${canvasRect.top}px`;
    frame.style.width = `${canvasRect.width}px`;
    frame.style.height = `${canvasRect.height}px`;

    this.currentCanvas$.next(canvas);
    this.state.currentTool$.next(Tool.Resize);
    this.listenToMoveCanvas(Tool.Frame);
  }

  public createLayer(img: HTMLImageElement): HTMLCanvasElement {
    const layer = document.createElement('canvas');
    // layer.width = img.width > 800 ? 800 : img.width;
    // layer.height = img.height > 600 ? 600 : img.height;
    layer.width = img.width;
    layer.height = img.height;

    return layer;
  }

  // public drawLayer(context: CanvasRenderingContext2D, layer: any): void {
  //   context.drawImage(layer.canvas, 0, 0);
  // }

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

  private listenToMoveCanvas(tool: Tool): void {
    const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');
    const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
    const dragStart$ = zip([this.mousedown$, this.currentCanvas$]).pipe(
      filter(([event, canvas]) => !!event && !!canvas),
    );
    const dragMove$ = dragStart$.pipe(
      switchMap(([event, canvas]) => {
        const frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
          `[tool="${Tool.Frame}"]`,
        );
        const coords = this.getCanvasCoords(canvas);
        const w = canvas.offsetLeft + canvas.width / 2;
        const h = canvas.offsetTop + canvas.height / 2;
        let ctx: CanvasRenderingContext2D;
        let canvasRect = canvas.getBoundingClientRect();
        let side: string;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRectWidth = canvasRect.width;
        const canvasRectHeight = canvasRect.height;
        // const originalImg = new Image();
        // originalImg.src = canvas.toDataURL();
        const canvasPrevRotation =
          +canvas.style.rotate?.replace('deg', '') || 0;
        const framePreviousRotation =
          +frame.style.rotate?.replace('deg', '') || 0;

        return mouseMove$.pipe(
          map((moveEvent: MouseEvent) => ({
            startEvent: event,
            originalEvent: moveEvent,
            coords: coords,
          })),
          tap((moveEvent) => {
            let deltaX: number;
            let deltaY: number;

            switch (tool) {
              case Tool.Rotation:
                deltaX = w - moveEvent.originalEvent.pageX;
                deltaY = h - moveEvent.originalEvent.pageY;
                const rad = Math.atan2(deltaY, deltaX);
                let deg = Math.round((rad * 180 - 270) / Math.PI);

                if (deg < 0) {
                  deg = (deg + 360) % 360;
                }

                frame.style.rotate = `${deg}deg`;
                canvas.style.rotate = `${
                  canvasPrevRotation - framePreviousRotation + deg
                }deg`;

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

                canvasRect = canvas.getBoundingClientRect();

                canvas.style.left = `${
                  deltaX - canvasRect.left + canvas.offsetLeft
                }px`;
                canvas.style.top = `${
                  deltaY - canvasRect.top + canvas.offsetTop
                }px`;
                frame.style.left = `${
                  deltaX - canvasRect.left + frame.offsetLeft
                }px`;
                frame.style.top = `${
                  deltaY - canvasRect.top + frame.offsetTop
                }px`;

                break;

              case Tool.Distortion:
                side = this.currentToolElement.getAttribute('side');

                switch (side) {
                  case ToolPointType.TopLeft:
                    break;

                  case ToolPointType.TopRight:
                    break;

                  case ToolPointType.BottomLeft:
                    break;

                  case ToolPointType.BottomRight:
                    break;
                }

                break;

              case Tool.Resize:
                const stopSignal = canvas.width <= 10 || canvas.height <= 10;
                const layer = this.state.currentLayer;
                const isProportional = true;
                const sizeProportion =
                  layer.originalHeight / layer.originalWidth;
                side = this.currentToolElement.getAttribute('side');

                switch (side) {
                  case ToolPointType.TopLeft:
                    deltaX =
                      moveEvent.originalEvent.pageX -
                      moveEvent.startEvent.pageX;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;

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
                    frame.style.width = `${Math.floor(
                      canvasRectWidth - deltaX,
                    )}px`;
                    frame.style.height = `${Math.floor(
                      canvasRectHeight - deltaY,
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

                  case ToolPointType.TopRight:
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

                  case ToolPointType.BottomLeft:
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

                  case ToolPointType.BottomRight:
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
        }),
      ),
    ]).subscribe();
  }
}
