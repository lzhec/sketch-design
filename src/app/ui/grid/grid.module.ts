import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './grid.component';
import { GridTileComponent } from './grid-tile.component';

@NgModule({
  imports: [CommonModule],
  declarations: [GridComponent, GridTileComponent],
  exports: [GridComponent, GridTileComponent],
})
export class GridModule {}
