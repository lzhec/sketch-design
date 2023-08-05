import { Injectable } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  UntypedFormControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { BaseObject } from './base-object';

@Injectable()
export abstract class BaseControl<T extends AbstractControl = UntypedFormControl>
  extends BaseObject
  implements ControlValueAccessor, Validator
{
  public _onValidatorChange: (val: any) => void;
  public _onTouched: () => void;
  public _onChange: (data: any) => void;
  public disabled: boolean;
  public formControl: T;
  public formControlName: string;

  constructor() {
    super();
  }

  public registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  public setDisabledState(value: boolean): void {
    this.disabled = value;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this._onValidatorChange = fn;
  }

  public validate(control: AbstractControl): ValidationErrors | null {
    return control.errors;
  }

  public writeValue(obj: any): void {}

  public getValue(): any {
    return this.formControl.value;
  }

  public getValid(): boolean {
    return this.formControl.valid;
  }
}
