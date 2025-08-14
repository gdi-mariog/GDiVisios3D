import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'map',
    loadComponent: () => import('./components/arcgis/map/map.component').then(m => m.MapComponent)
  },
  { path: '', redirectTo: 'map', pathMatch: 'full' }
];
