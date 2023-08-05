import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SketchComponent } from './sketch.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SettingsbarComponent } from './settingsbar/settingsbar.component';
import { CanvasComponent } from './canvas/canvas.component';
import { SketchRoutingModule } from './sketch-routing.module';
import { ButtonModule } from '@ui/button/button.module';
import { SketchState } from './sketch.state';

@NgModule({
  declarations: [
    SketchComponent,
    ToolbarComponent,
    SettingsbarComponent,
    CanvasComponent,
  ],
  imports: [CommonModule, SketchRoutingModule, ButtonModule],
  providers: [SketchState],
})
export class SketchModule {}
