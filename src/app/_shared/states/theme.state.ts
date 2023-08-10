import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import {
  $darkPalette,
  $lightPalette,
} from '@shared/constants/generated-theme-colors/generated-theme-colors';
import { ColorsMap } from '@shared/constants/generated-theme-colors/generated-types';
import { DOCUMENT } from '@angular/common';
import { BaseObject } from '@shared/base/base-object';
import { LocalStorageConstants } from '@shared/constants/local-storage-constants';

const ThemePrefix = 'app-theme';

export enum Theme {
  dark = 'app-theme-dark',
  light = 'app-theme-light',
}

@Injectable({
  providedIn: 'root',
})
export class ThemeState extends BaseObject {
  public readonly fontFamily = 'PP Object Sans'; // or 'Roboto, sans-serif'

  public readonly theme$: BehaviorSubject<Theme>;
  public readonly colors$: BehaviorSubject<ColorsMap>;
  public readonly logo$ = new BehaviorSubject<string>(
    '/assets/img/logo/logo.svg',
  );

  private initialTheme: Theme;
  private themeColors: Record<Theme, ColorsMap> = {
    [Theme.dark]: $darkPalette,
    [Theme.light]: $lightPalette,
  };

  private r: Renderer2;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private rendererFactory: RendererFactory2,
  ) {
    super();

    this.r = this.rendererFactory.createRenderer(null, null);

    this.initialTheme = Theme.light;
    this.colors$ = new BehaviorSubject<ColorsMap>(
      this.themeColors[this.initialTheme],
    );
    this.theme$ = new BehaviorSubject<Theme>(this.initialTheme);

    this.theme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      let logo: string;

      switch (theme) {
        case Theme.dark:
          logo = '/assets/img/logo/logo-dark.svg';
          break;

        case Theme.light:
          logo = '/assets/img/logo/logo-light.svg';
          break;
      }

      this.logo$.next(logo);
    });
  }

  public init(): void {
    const localStorageTheme = localStorage.getItem(
      LocalStorageConstants.CurrentTheme,
    );
    const findTheme = Object.values(Theme).find(
      (theme) => theme === localStorageTheme,
    );

    this.setTheme(findTheme || this.initialTheme);
  }

  public setTheme(theme: Theme): void {
    localStorage.setItem(LocalStorageConstants.CurrentTheme, theme);
    this.theme$.next(theme);

    this.colors$.next(this.themeColors[theme]);
    this.clearThemeClass();
    this.setThemeClass(theme);
  }

  private clearThemeClass(): void {
    const className = this.document
      .querySelector('html')
      .classList.value.split(' ')
      .find((className) => className.includes(ThemePrefix));

    this.r.removeClass(this.document.querySelector('html'), className);
  }

  private setThemeClass(theme: Theme): void {
    this.r.addClass(this.document.querySelector('html'), theme);
  }
}
