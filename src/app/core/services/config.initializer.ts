import { APP_INITIALIZER } from '@angular/core';
import { ConfigService } from './config.service';
import { firstValueFrom } from 'rxjs';

export function initializeApp(configService: ConfigService) {
  return (): Promise<any> => {
    console.log('Initializing application configuration...');
    return firstValueFrom(configService.loadConfig())
      .then(() => {
        console.log('Application configuration loaded successfully');
      })
      .catch(error => {
        console.error('Failed to initialize application configuration:', error);
        // Still resolve to allow app to start with default config
        return Promise.resolve();
      });
  };
}

export const CONFIG_INITIALIZER = {
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [ConfigService],
  multi: true
};
