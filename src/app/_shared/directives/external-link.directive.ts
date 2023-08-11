import { Directive, HostBinding, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appHref]',
})
export class ExternalLinkDirective implements OnChanges {
  @HostBinding('attr.rel') public relAttr = '';
  @HostBinding('attr.target') public targetAttr = '';

  @HostBinding('attr.href') public hrefAttr = '';

  @HostBinding('class.app-text-link') public get hostClass(): boolean {
    return !!this.hrefAttr;
  }

  @HostBinding('class.app-text-link--disabled') public get disabled(): boolean {
    return !this.hrefAttr;
  }

  @Input('appHref') public href: string;

  constructor() {}

  public ngOnChanges(): void {
    if (this.isLinkExternal()) {
      switch (true) {
        case this.href.includes('http://') || this.href.includes('https://'):
          this.hrefAttr = `${this.href}`;
          break;

        default:
          this.hrefAttr = `https://${this.href}`;
          break;
      }

      this.relAttr = 'noopener';
      this.targetAttr = '_blank';
    }
  }

  private isLinkExternal(): boolean {
    return this.href && !this.href.includes(location.hostname);
  }
}
