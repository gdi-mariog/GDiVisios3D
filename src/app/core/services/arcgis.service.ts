import { Injectable } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';

@Injectable({ providedIn: 'root' })
export class ArcGisService {
  map = new Map({ basemap: 'streets-vector' });
  view?: MapView;

  async init(container: HTMLDivElement, center: number[] = [0,0], zoom = 2) {
    this.view = new MapView({ container, map: this.map, center, zoom });
    return this.view.when();
  }

  addFeatureLayer(url: string, opts: Partial<__esri.FeatureLayerProperties> = {}): FeatureLayer {
    const layer = new FeatureLayer({ url, ...opts });
    this.map.add(layer);
    return layer;
  }

  addGraphicsLayer(): GraphicsLayer {
    const layer = new GraphicsLayer();
    this.map.add(layer);
    return layer;
  }

  addElevationLayer(url: string, opts: Partial<__esri.ElevationLayerProperties> = {}): ElevationLayer {
    const layer = new ElevationLayer({ url, ...opts });
    this.map.add(layer);
    return layer;
  }

  watchUpdating(cb: (updating: boolean) => void) {
    if (!this.view) return;
    return reactiveUtils.watch(
      () => this.view!.updating,
      (u) => cb(u)
    );
  }
}
