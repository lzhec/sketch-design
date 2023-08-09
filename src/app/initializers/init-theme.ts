import { ThemeState } from '@shared/states/theme.state';

export function initTheme(themeState: ThemeState): Function {
  return (): void => {
    themeState.init();
  };
}
