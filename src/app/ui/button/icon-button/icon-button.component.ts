import {
  Attribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  @Input() public prefixIcon: string;
  @Input() public suffixIcon: string;
  @Input() public suffixIconFill: 'fill' | 'stroke' = 'fill';
  @Input() public prefixIconFill: 'fill' | 'stroke' = 'fill';

  @Input()
  public type: 'vertical' | 'horizontal' = 'horizontal';

  @Input() public subType:
    | 'inverse'
    | 'static'
    | 'danger'
    | 'warning'
    | 'warning-extra'
    | 'success'
    | 'link' = null;

  @Input()
  @HostBinding('attr.disabled')
  public set disabled(value: boolean) {
    this._disabled = value;
  }

  public get disabled(): boolean {
    return this._disabled;
  }

  private _disabled: boolean = false;

  constructor(
    @Attribute('size')
    public size:
      | 'large'
      | 'middle-large'
      | 'middle'
      | 'middle-small'
      | 'small' = 'small',
    public element: ElementRef<HTMLElement>
  ) {}

  private get typeModifier(): { [className: string]: boolean } {
    let modifier = null;

    switch (this.type) {
      case 'horizontal':
        modifier = 'app-icon-button__horizontal';
        break;

      case 'vertical':
        modifier = 'app-icon-button__vertical';
        break;
    }

    return { [modifier]: true };
  }

  private get svgSizeModifier(): { [className: string]: boolean } {
    let modifier = null;

    switch (this.size) {
      case 'large':
        modifier = 'app-svg--large';
        break;

      case 'middle-large':
        modifier = 'app-svg--middle-large';
        break;

      case 'middle':
        modifier = 'app-svg--middle';
        break;

      case 'middle-small':
        modifier = 'app-svg--middle-small';
        break;

      case 'small':
        modifier = 'app-svg--small';
        break;
    }

    return { [modifier]: true };
  }

  public get classModifiers(): { [className: string]: boolean } {
    return {
      ...this.typeModifier,
    };
  }

  public get svgClassModifiers(): { [className: string]: boolean } {
    return {
      ...this.svgSizeModifier,
    };
  }
}
