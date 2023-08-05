import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Layer } from '../sketch.types';
import { SketchState } from '../sketch.state';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('viewport') canvas: ElementRef<HTMLCanvasElement>;

  constructor(private state: SketchState) {}

  public ngAfterViewInit(): void {
    fromEvent(this.canvas.nativeElement, 'mousedown').subscribe(
      (event: any) => {
        const ctx = this.canvas.nativeElement.getContext('2d');
        const x = event.offsetX;
        const y = event.offsetY;
        const cursorPixel = ctx.getImageData(x, y, 1, 1).data;
        const layers = this.state.layers;

        for (let i = 0; i < layers.length; i++) {
          const data = layers[i].data;
          const imgPixel = data.getImageData(x, y, 1, 1).data;
          console.log(cursorPixel, imgPixel);

          if (
            imgPixel[0] === cursorPixel[0] &&
            imgPixel[1] === cursorPixel[1] &&
            imgPixel[2] === cursorPixel[2]
          ) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, data.canvas.width, data.canvas.height);
            ctx.drawImage(data.canvas, 0, 0);
          }
        }
      },
    );
  }

  public createLayer(img: HTMLImageElement): CanvasRenderingContext2D {
    const layer = document.createElement('canvas');
    layer.width = img.width;
    layer.height = img.height;

    return layer.getContext('2d');
  }

  public drawLayer(context: CanvasRenderingContext2D, layer: any): void {
    context.drawImage(layer.canvas, 0, 0);
  }

  public addImage(file: File): void {
    const reader = new FileReader();
    const context = this.canvas.nativeElement.getContext('2d');

    reader.onload = (e: any) => {
      let originalImg = new Image();
      originalImg.src = e.target.result;

      originalImg.onload = () => {
        const layer = this.createLayer(originalImg);

        layer.drawImage(originalImg, 0, 0);
        this.drawLayer(context, layer);

        const newLayer: Layer = {
          name: new Date().getDate.toString(),
          type: 'image',
          data: layer,
          width: originalImg.naturalWidth || originalImg.width,
          height: originalImg.naturalHeight || originalImg.height,
          originalWidth: originalImg.naturalWidth || originalImg.width,
          originalHeight: originalImg.naturalHeight || originalImg.height,
        };

        this.state.layers.push(newLayer);
      };
    };
    reader.readAsDataURL(file);
  }
}
