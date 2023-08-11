import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SketchComponent } from './sketch.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SettingsbarComponent } from './settingsbar/settingsbar.component';
import { CanvasComponent } from './canvas/canvas.component';
import { SketchRoutingModule } from './sketch-routing.module';
import { ButtonModule } from '@ui/button/button.module';
import { SketchState } from './sketch.state';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MenuComponent } from './menu/menu.component';
import { GridModule } from '../ui/grid/grid.module';
import { DirectivesModule } from '@shared/directives/directives.module';

@NgModule({
  declarations: [
    SketchComponent,
    ToolbarComponent,
    SettingsbarComponent,
    CanvasComponent,
    SidebarComponent,
    MenuComponent,
  ],
  providers: [SketchState],
  imports: [
    CommonModule,
    SketchRoutingModule,
    ButtonModule,
    GridModule,
    DirectivesModule,
  ],
})
export class SketchModule {}
