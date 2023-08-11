import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightNumberDirective } from './highlight-number.directive';
import { ExternalLinkDirective } from './external-link.directive';
import { LetDirective } from './let.directive';
import { SvgModule } from '@ui/svg/svg.module';
import { EmitEventDirective } from './emit-event.directive';
import { VarDirective } from './var.directive';
import { ResizeObserverDirective } from './resize-observer.directive';

@NgModule({
  declarations: [
    HighlightNumberDirective,
    ExternalLinkDirective,
    LetDirective,
    EmitEventDirective,
    VarDirective,
    ResizeObserverDirective,
  ],
  exports: [
    HighlightNumberDirective,
    ExternalLinkDirective,
    LetDirective,
    EmitEventDirective,
    VarDirective,
    ResizeObserverDirective,
  ],
  imports: [CommonModule, SvgModule],
})
export class DirectivesModule {}
