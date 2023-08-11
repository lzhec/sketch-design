import {
  Directive,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { BaseObject } from '@shared/base/base-object';

@Directive({
  selector: '[appResizeObserver]',
  exportAs: 'appResizeObserver',
})
export class ResizeObserverDirective extends BaseObject implements OnInit {
  @Output('appResizeObserver.widthChange') public readonly widthChange =
    new EventEmitter<number>();
  @Output('appResizeObserver.heightChange') public readonly heightChange =
    new EventEmitter<number>();

  private observer: ResizeObserver;

  constructor(public el: ElementRef<HTMLElement>) {
    super();

    this.destroy$.subscribe(() =>
      this.observer.unobserve(this.el.nativeElement),
    );
  }

  public ngOnInit(): void {
    this.observer = new ResizeObserver((entries) => {
      this.widthChange.next(entries[0].contentRect.width);
      this.heightChange.next(entries[0].contentRect.height);
    });

    this.observer.observe(this.el.nativeElement);
  }
}
