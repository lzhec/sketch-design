import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appHighlightNumber]',
})
export class HighlightNumberDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  public ngAfterViewInit(): void {
    const el = this.el.nativeElement;
    const text = el.textContent.trim();

    if (text.charAt(0) === '+') {
      el.classList.add('app-text-success');
    } else if (text.charAt(0) === '-') {
      el.classList.add('app-text-danger');
    }
  }
}
