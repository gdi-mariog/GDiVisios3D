import { Injectable } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';

@Injectable({ providedIn: 'root' })
export class ArcGisService {
  map?: Map;
  view?: MapView;

  async init(map: Map, container: HTMLDivElement, center: number[] = [0,0], zoom = 2) {
    this.map = map;
    this.view = new MapView({ container, map: this.map, center, zoom });

    return this.view.when();
  }

  isMapInitialized(): boolean {
    return !!this.map;
  }

  addFeatureLayer(url: string, opts: Partial<__esri.FeatureLayerProperties> = {}): FeatureLayer {

    if (!this.map) throw new Error('Map not initialized');

    const layer = new FeatureLayer({ url, ...opts });
    this.map.add(layer);

    return layer;
  }

  addGraphicsLayer(): GraphicsLayer {
    if (!this.map) throw new Error('Map not initialized');

    const layer = new GraphicsLayer();
    this.map.add(layer);

    return layer;
  }

  addElevationLayer(url: string, opts: Partial<__esri.ElevationLayerProperties> = {}): ElevationLayer {
    if (!this.map) throw new Error('Map not initialized');

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
