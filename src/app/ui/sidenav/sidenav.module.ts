import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';

import { SidenavComponent } from '@ui/sidenav/sidenav.component';
import { NavMenuModule } from '@ui/nav-menu/nav-menu.module';
import { ButtonModule } from '@ui/button/button.module';
import { SvgModule } from '@ui/svg/svg.module';
import { DirectivesModule } from '@shared/directives/directive.module';

@NgModule({
  declarations: [SidenavComponent],
  exports: [SidenavComponent],
  imports: [
    CommonModule,
    NavMenuModule,
    MatSidenavModule,
    RouterModule,
    ButtonModule,
    SvgModule,
    DirectivesModule,
  ],
})
export class SidenavModule {}
