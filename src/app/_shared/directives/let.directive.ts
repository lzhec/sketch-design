import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

interface LetContext<T> {
  ngLet: T;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngLet]',
})
export class LetDirective<T> {
  private context: LetContext<T> = { ngLet: null };

  @Input()
  public set ngLet(value: T) {
    this.context.ngLet = value;
  }

  constructor(
    private viewContainerRef: ViewContainerRef,
    private templateRef: TemplateRef<LetContext<T>>,
  ) {
    this.viewContainerRef.createEmbeddedView(this.templateRef, this.context);
  }

  // Make sure the template checker knows the type of the context with which the
  // template of this directive will be rendered
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  static ngTemplateContextGuard<T>(
    dir: LetDirective<T>,
    ctx: unknown,
  ): ctx is LetContext<T> {
    return true;
  }
}
