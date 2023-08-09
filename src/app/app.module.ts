import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ThemeState } from '@shared/states/theme.state';
import { initTheme } from './initializers/init-theme';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initTheme,
      multi: true,
      deps: [ThemeState],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
