import { Subject } from 'rxjs';

export interface SvgLoadTask {
  src: string;
  result$: Subject<SVGElement>;
}
