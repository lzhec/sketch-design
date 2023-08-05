import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '@ui/button/button/button.component';
import { IconButtonComponent } from '@ui/button/icon-button/icon-button.component';
import { SvgModule } from '@ui/svg/svg.module';

@NgModule({
  declarations: [ButtonComponent, IconButtonComponent],
  exports: [ButtonComponent, IconButtonComponent],
  imports: [CommonModule, SvgModule],
})
export class ButtonModule {}
