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
  FlipToolType,
} from '../toolbar/toolbar.types';
import { BaseObject } from '@shared/base/base-object';
import { utils } from '@shared/utils/wrap';

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
      this.currentTool = tool;
      // switch (event) {
      //   case 'default':
      //   case 'move':
      //   case 'resize'
      // }
      // const tools: NodeListOf<HTMLDivElement> = this.getTools();
      // tools.forEach((tool) => {
      //   const attribute = tool.getAttribute('tool');
      // });
      const canvas = this.currentCanvas$.value;

      if (canvas) {
        switch (tool) {
          case 'wrap-frame':
            const handles: NodeListOf<HTMLDivElement> =
              this.canvas.nativeElement.querySelectorAll<HTMLDivElement>(
                `[tool="${Tool.Wrap}"]`,
              );

            const frame =
              this.canvas.nativeElement.querySelector<HTMLDivElement>(
                `[tool="${Tool.WrapFrame}"]`,
              );

            let canvasRect = canvas.getBoundingClientRect();

            frame.style.left = `${canvasRect.left}px`;
            frame.style.top = `${canvasRect.top}px`;
            frame.style.width = `${canvasRect.width}px`;
            frame.style.height = `${canvasRect.height}px`;

            this.state.currentLayer.corners.forEach((corner, index) => {
              handles[index].style.left = corner[0] + 'px';
              handles[index].style.top = corner[1] + 'px';
            });
        }
      }
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

  private flipCanvas(type: FlipToolType): void {
    const canvas = this.currentCanvas$.value;

    if (!canvas) {
      return;
    }

    // const rect = canvas.getBoundingClientRect();
    const frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
      `[tool=${Tool.Movement}]`,
    );

    if (frame.offsetLeft !== canvas.offsetLeft) {
      let deg = -canvas.style.rotate.replace('deg', '');

      if (deg < 0) {
        deg = (deg + 360) % 360;
      }

      canvas.style.rotate = `${deg}deg`;
    }

    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    img.src = canvas.toDataURL();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      if (type === 'horizontal') {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      } else {
        ctx.scale(1, -1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
  }

  public toolbarQuickEventHandler(event: QuickToolEvent): void {
    switch (event.tool) {
      case 'flip':
        this.flipCanvas(event.type);
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

  // private getTools(): NodeListOf<HTMLDivElement> {
  //   return this.canvas.nativeElement.querySelectorAll<HTMLDivElement>('[tool]');
  // }

  private selectLayerByFrame(element: HTMLDivElement, tool: Tool): void {
    // const canvas = this.canvas.nativeElement.querySelector<HTMLCanvasElement>(
    //   `[id="${this.state.currentLayer.id}"]`,
    // );

    this.state.currentTool$.next(tool);
    this.currentToolElement = element;

    this.listenToChangeCanvas(tool);
  }

  private selectLayerByCanvas(canvas: HTMLCanvasElement): void {
    let frame: HTMLDivElement;

    switch (this.currentTool) {
      case 'wrap-frame':
        frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
          `[tool="${Tool.WrapFrame}"]`,
        );
        break;

      default:
        frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
          `[tool="${Tool.Movement}"]`,
        );
    }

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
    this.state.currentTool$.next(Tool.Movement);
    this.listenToChangeCanvas(Tool.Movement);
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
          data: originalImg,
          originalData: originalImg,
          width: originalImg.naturalWidth || originalImg.width,
          height: originalImg.naturalHeight || originalImg.height,
          originalWidth: originalImg.naturalWidth || originalImg.width,
          originalHeight: originalImg.naturalHeight || originalImg.height,
          corners: [
            [-10, -10],
            [layer.width - 10, -10],
            [layer.width / 2 - 10, layer.height / 2 - 10],
            [-10, layer.height - 10],
            [layer.width - 10, layer.height - 10],
          ],
          originalCorners: [
            [-10, -10],
            [layer.width - 10, -10],
            [layer.width / 2 - 10, layer.height / 2 - 10],
            [-10, layer.height - 10],
            [layer.width - 10, layer.height - 10],
          ],
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

  private listenToChangeCanvas(tool: Tool): void {
    const mouseMove$: Observable<Event> = fromEvent(document, 'mousemove');
    const mouseUp$: Observable<Event> = fromEvent(document, 'mouseup');
    const dragStart$ = zip([this.mousedown$, this.currentCanvas$]).pipe(
      filter(([event, canvas]) => !!event && !!canvas),
    );
    const dragMove$ = dragStart$.pipe(
      switchMap(([event, canvas]) => {
        function updateUI() {
          function drawTriangle(s1, s2, s3, d1, d2, d3) {
            const [d1x, d2x, d3x] = utils.expandTriangle(d1, d2, d3, 0.3),
              [s1x, s2x, s3x] = utils.expandTriangle(s1, s2, s3, 0.3);

            utils.drawImageTriangle(img, ctx, s1x, s2x, s3x, d1x, d2x, d3x);
          }

          ctx.clearRect(0, 0, w, h);

          drawTriangle(
            [0, 0],
            [w / 2, h / 2],
            [0, h],
            corners[0],
            corners[2],
            corners[3],
          );
          //*
          drawTriangle(
            [0, 0],
            [w / 2, h / 2],
            [w, 0],
            corners[0],
            corners[2],
            corners[1],
          );

          drawTriangle(
            [w, 0],
            [w / 2, h / 2],
            [w, h],
            corners[1],
            corners[2],
            corners[4],
          );

          drawTriangle(
            [0, h],
            [w / 2, h / 2],
            [w, h],
            corners[3],
            corners[2],
            corners[4],
          );

          corners.forEach((c, i) => {
            const s = handles[i].style;
            s.left = c[0] + 'px';
            s.top = c[1] + 'px';
          });
        }

        const movement =
          this.canvas.nativeElement.querySelector<HTMLDivElement>(
            `[tool="${Tool.Movement}"]`,
          );
        const wrapFrame =
          this.canvas.nativeElement.querySelector<HTMLDivElement>(
            `[tool="${Tool.WrapFrame}"]`,
          );
        const coords = this.getCanvasCoords(canvas);
        const offsetWidthCenter = canvas.offsetLeft + canvas.width / 2;
        const offsetHeightCenter = canvas.offsetTop + canvas.height / 2;
        let ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = this.state.currentLayer.originalData.src;
        let w = img.width,
          h = img.height;
        let canvasRect = canvas.getBoundingClientRect();
        let side: string;
        let corners = this.state.currentLayer.corners;
        let onStartCorners = [...this.state.currentLayer.corners];
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRectWidth = canvasRect.width;
        const canvasRectHeight = canvasRect.height;
        // const originalImg = new Image();
        // originalImg.src = canvas.toDataURL();
        const canvasPrevRotation =
          +canvas.style.rotate?.replace('deg', '') || 0;
        const framePreviousRotation =
          +movement.style.rotate?.replace('deg', '') || 0;
        const handles =
          this.canvas.nativeElement.querySelectorAll<HTMLDivElement>(
            `[tool=${Tool.Wrap}]`,
          );

        // if (!corners) {
        //   corners = [
        //     [-10, -10],
        //     [canvas.width - 10, -10],
        //     [canvas.width / 2 - 10, canvas.height / 2 - 10],
        //     [-10, canvas.height - 10],
        //     [canvas.width - 10, canvas.height - 10],
        //   ];
        // }

        // updateUI();

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
                deltaX = offsetWidthCenter - moveEvent.originalEvent.pageX;
                deltaY = offsetHeightCenter - moveEvent.originalEvent.pageY;
                const rad = -Math.atan2(deltaX, deltaY);
                let deg = Math.round((rad * 180) / Math.PI);
                // let deg = (rad * 180) / Math.PI;

                if (deg < 0) {
                  deg = (deg + 360) % 360;
                }

                movement.style.rotate = `${deg}deg`;
                canvas.style.rotate = `${
                  canvasPrevRotation - framePreviousRotation + deg
                }deg`;

                break;

              case Tool.Movement:
              case Tool.WrapFrame:
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
                movement.style.left = `${
                  deltaX - canvasRect.left + movement.offsetLeft
                }px`;
                movement.style.top = `${
                  deltaY - canvasRect.top + movement.offsetTop
                }px`;
                wrapFrame.style.left = `${
                  deltaX - canvasRect.left + wrapFrame.offsetLeft
                }px`;
                wrapFrame.style.top = `${
                  deltaY - canvasRect.top + wrapFrame.offsetTop
                }px`;

                break;

              case Tool.Wrap:
                side = this.currentToolElement.getAttribute('side');

                switch (side) {
                  case ToolPointType.TopLeft:
                    deltaX =
                      moveEvent.originalEvent.pageX -
                      moveEvent.startEvent.pageX;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;

                    // wrapFrame.style.left = `${Math.floor(
                    //   event.clientX + deltaX,
                    // )}px`;
                    // wrapFrame.style.top = `${Math.floor(
                    //   event.clientY + deltaY,
                    // )}px`;
                    // wrapFrame.style.width = `${Math.floor(
                    //   canvasRectWidth - deltaX,
                    // )}px`;
                    // wrapFrame.style.height = `${Math.floor(
                    //   canvasRectHeight - deltaY,
                    // )}px`;
                    // canvas.style.left = `${Math.floor(
                    //   event.clientX + deltaX,
                    // )}px`;
                    // canvas.style.top = `${Math.floor(
                    //   event.clientY + deltaY,
                    // )}px`;
                    // canvas.width = Math.floor(canvasRectWidth - deltaX);
                    // canvas.height = Math.floor(canvasRectHeight - deltaY);
                    break;

                  case ToolPointType.TopRight:
                    deltaX =
                      moveEvent.originalEvent.pageX - moveEvent.coords.left;
                    deltaY =
                      moveEvent.originalEvent.pageY -
                      moveEvent.startEvent.pageY;
                    break;

                  case ToolPointType.Center:
                    deltaX =
                      moveEvent.originalEvent.pageX - moveEvent.coords.left;
                    deltaY =
                      moveEvent.originalEvent.pageY - moveEvent.coords.top;
                    break;

                  case ToolPointType.BottomLeft:
                    deltaX =
                      moveEvent.originalEvent.pageX -
                      moveEvent.startEvent.pageX;
                    deltaY =
                      moveEvent.originalEvent.pageY - moveEvent.coords.top;
                    break;

                  case ToolPointType.BottomRight:
                    deltaX =
                      moveEvent.originalEvent.pageX - moveEvent.coords.left;
                    deltaY =
                      moveEvent.originalEvent.pageY - moveEvent.coords.top;
                    break;
                }

                const dataCorner = +this.currentToolElement.dataset['corner'];

                switch (dataCorner) {
                  case 0:
                    corners[dataCorner] = [
                      onStartCorners[dataCorner][0] + deltaX,
                      onStartCorners[dataCorner][1] + deltaY,
                    ];

                    break;

                  case 1:
                    corners[dataCorner] = [
                      deltaX,
                      onStartCorners[dataCorner][1] + deltaY,
                    ];

                    break;

                  case 3:
                    corners[dataCorner] = [
                      onStartCorners[dataCorner][0] + deltaX,
                      deltaY,
                    ];

                    break;

                  case 2:
                  case 4:
                    corners[dataCorner] = [deltaX, deltaY];

                    break;
                }

                // this.state.currentLayer.corners = corners;

                updateUI();

                break;

              case Tool.Resize:
                const stopSignal = canvas.width <= 10 || canvas.height <= 10;
                const layer = this.state.currentLayer;
                const isProportional = true;
                const sizeProportion =
                  layer.originalHeight / layer.originalWidth;
                side = this.currentToolElement.getAttribute('side');
                const originalCanwasWidth = canvas.width;
                const originalCanwasHeight = canvas.height;

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

                    movement.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    movement.style.top = `${Math.floor(
                      event.clientY + deltaY,
                    )}px`;
                    movement.style.width = `${Math.floor(
                      canvasRectWidth - deltaX,
                    )}px`;
                    movement.style.height = `${Math.floor(
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

                    movement.style.top = `${event.clientY + deltaY}px`;
                    movement.style.width = `${Math.floor(
                      canvasWidth + deltaX,
                    )}px`;
                    movement.style.height = `${Math.floor(
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

                    movement.style.left = `${Math.floor(
                      event.clientX + deltaX,
                    )}px`;
                    movement.style.width = `${Math.floor(
                      canvasWidth - deltaX,
                    )}px`;
                    movement.style.height = `${Math.floor(
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

                    movement.style.width = `${Math.floor(deltaX)}px`;
                    movement.style.height = `${Math.floor(deltaY)}px`;
                    canvas.width = Math.floor(deltaX);
                    canvas.height = Math.floor(deltaY);

                    break;
                }

                corners.forEach((c, i) => {
                  c[0] =
                    (canvas.width / originalCanwasWidth) * onStartCorners[i][0];
                  c[1] =
                    (canvas.height / originalCanwasHeight) *
                    onStartCorners[i][1];

                  // if (c[0] < 0) {
                  //   c[0] += 10;
                  // }

                  // if (c[1] < 0) {
                  //   c[1] += 10;
                  // }
                });

                ctx = canvas.getContext('2d');

                ctx.drawImage(
                  layer.originalData,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
            }

            // this.state.currentLayer.corners = [
            //   [-10, -10],
            //   [canvas.width - 10, -10],
            //   [canvas.width / 2 - 10, canvas.height / 2 - 10],
            //   [-10, canvas.height - 10],
            //   [canvas.width - 10, canvas.height - 10],
            // ];
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
