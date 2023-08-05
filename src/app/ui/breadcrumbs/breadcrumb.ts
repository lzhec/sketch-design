interface IBreadcrumb {
  label: string;
  href?: string;
}

export class Breadcrumb {
  public label: string;
  public href?: string;

  constructor(obj: IBreadcrumb = { label: '', href: '' }) {
    this.label = obj.label;
    this.href = obj.href;
  }
}
