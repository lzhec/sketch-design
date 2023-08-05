import { FormControl } from '@angular/forms';

export type FormGroupByType<D> = {
  [K in keyof D]: FormControl<D[K]>;
};
