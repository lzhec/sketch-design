import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { NavMenuComponent } from './nav-menu.component';
import { ButtonModule } from '@ui/button/button.module';
import { TranslatesModule } from '@shared/translate/translates.module';
import { DirectivesModule } from '@shared/directives/directive.module';

@NgModule({
  declarations: [NavMenuComponent],
  exports: [NavMenuComponent],
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TranslatesModule,
    TranslateModule,
    DirectivesModule,
  ],
})
export class NavMenuModule {}
