import { Env } from './environment.type';

export const environment: Env = {
  production: false,
  apiPath: '/api',
  wsPath: 'wss://dev.ugol.ru/api/websocket',
  isReleaseSite: false,
  isDevSite: true
};
