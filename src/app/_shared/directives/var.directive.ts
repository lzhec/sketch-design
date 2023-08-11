import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngVar]',
  exportAs: 'ngVar',
})
export class VarDirective<T> {
  private _value: T;

  public readonly value$ = new BehaviorSubject<T>(null);

  @Input()
  public set ngVar(value: T) {
    this.setValue(value);
  }

  public set value(value: T) {
    this.setValue(value);
  }

  public get value(): T {
    return this._value;
  }

  @Output() public readonly ngVarChanged = new EventEmitter<T>();

  constructor() {}

  private setValue(value: T): void {
    this._value = value;
    this.value$.next(value);
    this.ngVarChanged.next(value);
  }
}
