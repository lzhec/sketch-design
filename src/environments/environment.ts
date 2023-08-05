// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { Env } from './environment.type';

export const environment: Env = {
  production: false,
  apiPath: '/api',
  wsPath: 'wss://dev.ugol.ru/api/websocket',
  isReleaseSite: false,
  isDevSite: true,
};
