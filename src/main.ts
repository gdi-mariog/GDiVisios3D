import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Register ArcGIS Map Components
import { defineCustomElements } from '@arcgis/map-components/dist/loader';

// Register the custom elements
defineCustomElements(window, { resourcesUrl: 'https://js.arcgis.com/map-components/4.30/assets' });

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
