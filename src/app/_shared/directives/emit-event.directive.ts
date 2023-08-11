import { Directive, Output, EventEmitter, Input } from '@angular/core';

@Directive({
  selector: '[appEmitEvent]',
})
export class EmitEventDirective<TValue = any> {
  @Input('pushValue') public set value(v: TValue) {
    this.event.next(v);
  }

  @Output('appEmitEvent') public readonly event = new EventEmitter<TValue>();

  constructor() {}
}
