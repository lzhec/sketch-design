import { Inject, Injectable, NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Observable, of, Subject, zip } from 'rxjs';
import {
  bufferWhen,
  catchError,
  concatMap,
  filter,
  map,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { SvgLoadTask } from '@ui/svg/svg.type';
import {SettingsState} from "@shared/states/settings.state";
import { BaseObject } from '@shared/base/base-object';


@Injectable({
  providedIn: 'root',
})
export class SvgService extends BaseObject {
  private newTask$ = new Subject<SvgLoadTask>();

  public svgCache = new Map<string, SVGElement>();
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient,
    private zone: NgZone,
    private settingsState: SettingsState
  ) {
    super();

    this.zone.runOutsideAngular(() => {
      this.listenToTasks();
    });
  }

  public get(src: string): Observable<SVGElement> {
    src = this.trimIfRequired(src);

    if (this.svgCache.has(src)) {
      return of(this.svgCache.get(src));
    } else {
      const task: SvgLoadTask = { src, result$: new Subject<SVGElement>() };

      this.newTask$.next(task);

      return task.result$;
    }
  }

  private loadSvgIfRequired(src: string): Observable<SVGElement> {
    if (this.svgCache.has(src)) {
      return of(this.svgCache.get(src));
    } else {
      return this.http
        .request('GET', `${this.settingsState.frontPath}${src}`, {
          responseType: 'text',
        })
        .pipe(
          map((svgString) => {
            const div = this.document.createElement('div');
            div.innerHTML = svgString;
            const svg: SVGElement = div.querySelector('svg');

            this.svgCache.set(src, svg);

            return svg;
          }),
          catchError(() => of(null))
        );
    }
  }

  private listenToTasks(): void {
    this.newTask$
      .pipe(
        bufferWhen(() => interval(300)),
        filter((newTasks) => !!newTasks.length),
        concatMap((newTasks) => {
          const loadTasksMap = new Map<string, Observable<SVGElement>>();

          newTasks.forEach((newTask) => {
            if (!loadTasksMap.has(newTask.src)) {
              loadTasksMap.set(
                newTask.src,
                this.loadSvgIfRequired(newTask.src)
              );
            }
          });

          const loadTasks$ = zip(
            ...[...loadTasksMap.entries()].map(([src, obs]) =>
              zip(of(src), obs)
            )
          );

          const load$ = loadTasks$.pipe(
            tap((loadedTasks) => {
              newTasks.forEach((newTask) => {
                const loadedTask = loadedTasks.find(
                  ([src, _]) => src === newTask.src
                );

                if (loadedTask) {
                  newTask.result$.next(this.svgCache.get(newTask.src));
                  newTask.result$.complete();
                }
              });

              loadTasksMap.clear();
            })
          );

          return load$;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private trimIfRequired(src: string): string {
    return src.startsWith('/') ? src.slice(1) : src;
  }
}
