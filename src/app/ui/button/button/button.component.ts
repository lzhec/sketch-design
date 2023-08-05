import {
  Attribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-button',
  },
})
export class ButtonComponent {
  @Input()
  public type:
    | 'primary'
    | 'secondary'
    | 'transparent'
    | 'danger'
    | 'success'
    | 'warning' = 'primary';

  @Input()
  @HostBinding('attr.disabled')
  public set disabled(value: boolean) {
    this._disabled = value;
  }

  @HostBinding('class')
  public get _classModifiers(): { [className: string]: boolean } {
    return {
      ...this.typeModifier,
      ...this.sizeModifier,
    };
  }

  public get disabled(): boolean {
    return this._disabled;
  }

  private _disabled: boolean = false;

  constructor(
    @Attribute('size')
    public size: 'large' | 'middle-large' | 'middle' | 'small',
    public element: ElementRef<HTMLElement>
  ) {
    this.size = this.size || 'middle';
  }

  private get typeModifier(): { [className: string]: boolean } {
    let modifier = null;

    switch (this.type) {
      case 'primary':
        modifier = 'app-button--primary';
        break;

      case 'secondary':
        modifier = 'app-button--secondary';
        break;

      case 'transparent':
        modifier = 'app-button--transparent';
        break;

      case 'danger':
        modifier = 'app-button--danger';
        break;

      case 'success':
        modifier = 'app-button--success';
        break;

      case 'warning':
        modifier = 'app-button--warning';
        break;
    }

    return { [modifier]: true };
  }

  private get sizeModifier(): { [className: string]: boolean } {
    let modifier = null;

    switch (this.size) {
      case 'large':
        modifier = 'app-button--large';
        break;

      case 'middle-large':
        modifier = 'app-button--middle-large';
        break;

      case 'middle':
        modifier = 'app-button--middle';
        break;

      case 'small':
        modifier = 'app-button--small';
        break;
    }

    return { [modifier]: true };
  }
}
