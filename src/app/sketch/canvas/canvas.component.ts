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
import { findExtremes } from '@shared/helpers/functions';

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
      if (this.currentTool === tool) {
        return;
      }
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
        const canvasRect = canvas.getBoundingClientRect();
        let frame: HTMLDivElement;

        switch (tool) {
          case 'wrap-frame':
            const handles: NodeListOf<HTMLDivElement> =
              this.canvas.nativeElement.querySelectorAll<HTMLDivElement>(
                `[tool="${Tool.Wrap}"]`,
              );

            frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
              `[tool="${Tool.WrapFrame}"]`,
            );

            this.state.currentLayer.corners.forEach((corner, index) => {
              handles[index].style.left = corner[0] + 'px';
              handles[index].style.top = corner[1] + 'px';
            });

            frame.style.left = `${canvasRect.left}px`;
            frame.style.top = `${canvasRect.top}px`;
            frame.style.width = `${canvasRect.width}px`;
            frame.style.height = `${canvasRect.height}px`;

            break;

          case 'movement':
            frame = this.canvas.nativeElement.querySelector<HTMLDivElement>(
              `[tool="${Tool.Movement}"]`,
            );

            frame.style.left = `${canvasRect.left}px`;
            frame.style.top = `${canvasRect.top}px`;
            frame.style.width = `${canvasRect.width}px`;
            frame.style.height = `${canvasRect.height}px`;

            break;
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
            [-10, layer.height - 10],
            [layer.width - 10, layer.height - 10],
          ],
          originalCorners: [
            [-10, -10],
            [layer.width - 10, -10],
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

        let triangles = [];
        let dirtyTriangles = true;

        const draw = function () {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const render = function (wireframe, img, tri) {
            if (wireframe) {
              ctx.strokeStyle = 'black';
              ctx.beginPath();
              ctx.moveTo(tri.p0.x, tri.p0.y);
              ctx.lineTo(tri.p1.x, tri.p1.y);
              ctx.lineTo(tri.p2.x, tri.p2.y);
              ctx.lineTo(tri.p0.x, tri.p0.y);
              ctx.stroke();
              ctx.closePath();
            }

            if (img) {
              drawTriangle(
                ctx,
                img,
                tri.p0.x,
                tri.p0.y,
                tri.p1.x,
                tri.p1.y,
                tri.p2.x,
                tri.p2.y,
                tri.t0.u,
                tri.t0.v,
                tri.t1.u,
                tri.t1.v,
                tri.t2.u,
                tri.t2.v,
              );
            }
          };

          if (dirtyTriangles) {
            dirtyTriangles = false;
            calculateGeometry();
          }

          for (let triangle of triangles) {
            render(false, img, triangle);
          }
        };

        const calculateGeometry = function () {
          triangles = [];
          const subs = 7;
          const divs = 7;

          const p1 = new Point(
            +handles[0].style.left.replace('px', '') + 6,
            +handles[0].style.top.replace('px', '') + 6,
          );
          const p2 = new Point(
            +handles[1].style.left.replace('px', '') + 6,
            +handles[1].style.top.replace('px', '') + 6,
          );
          const p4 = new Point(
            +handles[2].style.left.replace('px', '') + 6,
            +handles[2].style.top.replace('px', '') + 6,
          );
          const p3 = new Point(
            +handles[3].style.left.replace('px', '') + 6,
            +handles[3].style.top.replace('px', '') + 6,
          );

          const dx1 = p4.x - p1.x;
          const dy1 = p4.y - p1.y;
          const dx2 = p3.x - p2.x;
          const dy2 = p3.y - p2.y;

          const imgW = img.naturalWidth;
          const imgH = img.naturalHeight;

          for (let sub = 0; sub < subs; ++sub) {
            const curRow = sub / subs;
            const nextRow = (sub + 1) / subs;
            const curRowX1 = p1.x + dx1 * curRow;
            const curRowY1 = p1.y + dy1 * curRow;
            const curRowX2 = p2.x + dx2 * curRow;
            const curRowY2 = p2.y + dy2 * curRow;
            const nextRowX1 = p1.x + dx1 * nextRow;
            const nextRowY1 = p1.y + dy1 * nextRow;
            const nextRowX2 = p2.x + dx2 * nextRow;
            const nextRowY2 = p2.y + dy2 * nextRow;

            for (let div = 0; div < divs; ++div) {
              const curCol = div / divs;
              const nextCol = (div + 1) / divs;
              const dCurX = curRowX2 - curRowX1;
              const dCurY = curRowY2 - curRowY1;
              const dNextX = nextRowX2 - nextRowX1;
              const dNextY = nextRowY2 - nextRowY1;
              const p1x = curRowX1 + dCurX * curCol;
              const p1y = curRowY1 + dCurY * curCol;
              const p2x = curRowX1 + (curRowX2 - curRowX1) * nextCol;
              const p2y = curRowY1 + (curRowY2 - curRowY1) * nextCol;
              const p3x = nextRowX1 + dNextX * nextCol;
              const p3y = nextRowY1 + dNextY * nextCol;
              const p4x = nextRowX1 + dNextX * curCol;
              const p4y = nextRowY1 + dNextY * curCol;
              const u1 = curCol * imgW;
              const u2 = nextCol * imgW;
              const v1 = curRow * imgH;
              const v2 = nextRow * imgH;

              const triangle1 = new Triangle(
                new Point(p1x - 1, p1y),
                new Point(p3x + 2, p3y + 1),
                new Point(p4x - 1, p4y + 1),
                new TextCoord(u1, v1),
                new TextCoord(u2, v2),
                new TextCoord(u1, v2),
              );

              const triangle2 = new Triangle(
                new Point(p1x - 2, p1y),
                new Point(p2x + 1, p2y),
                new Point(p3x + 1, p3y + 1),
                new TextCoord(u1, v1),
                new TextCoord(u2, v1),
                new TextCoord(u2, v2),
              );

              triangles.push(triangle1);
              triangles.push(triangle2);
            }
          }
        };

        const drawTriangle = function (
          ctx,
          im,
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          sx0,
          sy0,
          sx1,
          sy1,
          sx2,
          sy2,
        ) {
          ctx.save();

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.closePath();
          // ctx.stroke(); //xxxxxxx for wireframe
          ctx.clip();

          const denom =
            sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;

          if (denom == 0) {
            return;
          }

          const m11 =
            -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
          const m12 =
            (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
          const m21 =
            (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
          const m22 =
            -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
          const dx =
            (sx0 * (sy2 * x1 - sy1 * x2) +
              sy0 * (sx1 * x2 - sx2 * x1) +
              (sx2 * sy1 - sx1 * sy2) * x0) /
            denom;
          const dy =
            (sx0 * (sy2 * y1 - sy1 * y2) +
              sy0 * (sx1 * y2 - sx2 * y1) +
              (sx2 * sy1 - sx1 * sy2) * y0) /
            denom;

          ctx.transform(m11, m12, m21, m22, dx, dy);

          ctx.drawImage(im, 0, 0);
          ctx.restore();
        };

        const Point = function (x = 0, y = 0) {
          this.x = x;
          this.y = y;
        };

        const p = Point.prototype;

        p.length = function (point) {
          point = point ? point : new Point();
          let xs = 0;
          let ys = 0;
          xs = point.x - this.x;
          xs = xs * xs;
          ys = point.y - this.y;
          ys = ys * ys;
          return Math.sqrt(xs + ys);
        };

        const TextCoord = function (u, v) {
          this.u = u ? u : 0;
          this.v = v ? v : 0;
        };

        const Triangle = function (p0, p1, p2, t0, t1, t2) {
          this.p0 = p0;
          this.p1 = p1;
          this.p2 = p2;
          this.t0 = t0;
          this.t1 = t1;
          this.t2 = t2;
        };

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

                  case 2:
                    corners[dataCorner] = [
                      onStartCorners[dataCorner][0] + deltaX,
                      deltaY,
                    ];

                    break;

                  case 3:
                    corners[dataCorner] = [deltaX, deltaY];

                    break;
                }

                handles[dataCorner].style.left = corners[dataCorner][0] + 'px';
                handles[dataCorner].style.top = corners[dataCorner][1] + 'px';
                dirtyTriangles = true;
                // this.state.currentLayer.corners = corners;

                // const leftCoords = [];
                // const topCoords = [];

                // handles.forEach((p) => {
                //   leftCoords.push(p.offsetLeft);
                //   topCoords.push(p.offsetTop);
                // });

                // const leftExtremes = findExtremes(leftCoords);
                // const topExtremes = findExtremes(topCoords);

                // wrapFrame.style.left = `${leftExtremes.min}px`;
                // wrapFrame.style.top = `${topExtremes.min}px`;
                // wrapFrame.style.width = `${
                //   leftExtremes.max - leftExtremes.min
                // }px`;
                // wrapFrame.style.height = `${
                //   topExtremes.max - topExtremes.min
                // }px`;

                draw();

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
