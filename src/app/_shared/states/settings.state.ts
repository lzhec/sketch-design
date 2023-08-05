import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsState {
  private _apiPath: string;
  private _frontPath: string;
  private _wsPath: string;

  constructor() {
    this._apiPath = `${location.origin}${environment.apiPath}`;
    this._frontPath = location.origin;

    if (environment.production) {
      const isHttps = location.protocol.startsWith('https');

      this._wsPath = `${isHttps ? 'wss' : 'ws'}://${location.host}${environment.apiPath}${
        environment.wsPath
      }`;
    } else {
      this._wsPath = environment.wsPath;
    }
  }

  public get apiPath(): string {
    return this._apiPath;
  }

  public get frontPath(): string {
    return this._frontPath;
  }

  public get wsPath(): string {
    return this._wsPath;
  }

  public get version(): string {
    return localStorage.getItem('version');
  }

  public set version(value: string) {
    localStorage.setItem('version', value);
  }
}
