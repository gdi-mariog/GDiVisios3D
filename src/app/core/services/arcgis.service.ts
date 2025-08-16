import { Injectable } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Ground from '@arcgis/core/Ground';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

//import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import WMSLayer from '@arcgis/core/layers/WMSLayer';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import PointCloudLayer from '@arcgis/core/layers/PointCloudLayer';
import BuildingSceneLayer from '@arcgis/core/layers/BuildingSceneLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import IntegratedMeshLayer from '@arcgis/core/layers/IntegratedMeshLayer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import { AppConfig, LayerConfig } from '../interfaces/config.interface';
import SceneView from '@arcgis/core/views/SceneView';

@Injectable({ providedIn: 'root' })
export class ArcGisService {
  map?: Map;
  mapView?: MapView;
  sceneView?: SceneView;

  async initMapView(container: HTMLDivElement, cfg: AppConfig): Promise<MapView> {
    if (!this.map)
       this.createMapFromConfig(cfg);

    this.mapView = new MapView({
      container,
      map: this.map,
      center: [ cfg.viewLonLatElevation[0] ?? 15.9793, cfg.viewLonLatElevation[1] ?? 45.7776 ],
      zoom: cfg.viewLonLatElevation[2] ?? 12
    });

    await this.mapView.when();

    return this.mapView;
  }

  async initSceneView(container: HTMLDivElement, cfg: AppConfig): Promise<SceneView> {
    if (!this.map) this.createMapFromConfig(cfg);

    const [lon, lat, elev] = cfg.viewLonLatElevation ?? [15.9793, 45.7776, 1200];
    const [heading, tilt/*, fov*/] = cfg.viewHeadingTiltFOV ?? [0, 66, 55];

    this.sceneView = new SceneView({
      container,
      map: this.map,
      camera: {
        position: { longitude: lon, latitude: lat, z: elev ?? 1200 },
        heading,
        tilt
      },
      qualityProfile: (cfg.viewQualityProfile as any) ?? 'high',
      environment: {
        lighting: { directShadowsEnabled: true, date: cfg.initialDateTime ? new Date(cfg.initialDateTime) : undefined },
        starsEnabled: cfg.starsEnabled ?? true,
        atmosphereEnabled: cfg.atmosphereEnabled ?? true
      },
      popup: { dockEnabled: true, dockOptions: { position: cfg.popupPosition ?? 'top-center' } }
    });

    await this.sceneView.when();

    return this.sceneView;
  }

  onUpdating(cb: (updating: boolean) => void) {
    if (!this.mapView) return;

    return reactiveUtils.watch(
      () => this.mapView!.updating,
      (u) => cb(u)
    );
  }

    createMapFromConfig(cfg: AppConfig): Map {
    // const ground =
    //   cfg.elevationLayerUrls?.length
    //     ? new Ground({
    //         layers: cfg.elevationLayerUrls.map((url: string) => new ElevationLayer({ url: url }))
    //       })
    //     : undefined;

    // this.map = new Map({
    //   basemap: cfg.basemap ?? 'streets-vector',
    //   ground
    // });

    this.map = new Map({
      basemap: cfg.basemap ?? 'streets-vector'
    });

    for (const layerCfg of cfg.layers ?? []) {
      const layer = this.createLayer(layerCfg);

      if (layer) 
        this.map.add(layer);

      if(cfg.elevationLayerUrls !== null)
      {
        cfg.elevationLayerUrls.forEach((item: string) => {
          this.map!.ground.layers.push(new ElevationLayer({
            url: item
          }));
        });
      }
    }

    return this.map;
  }
  
    private commonProps(cfg: LayerConfig) {
    // NOTE: we intentionally DO NOT include legendEnabled here (UI-only)
    const common: any = {
      title: cfg.title,
      visible: cfg.visible ?? true,
      minScale: cfg.minScale,
      maxScale: cfg.maxScale
    };

    if (cfg.id)
      common.id = cfg.id;

    // Only add listMode if it’s one of the allowed values
    if (cfg.listMode)
      common.listMode = cfg.listMode;

    if (cfg.opacity)
  // Do not set opacity here; set it only for supported layer types in createLayer

    // visibilityMode is only on GroupLayer, we’ll handle it there
    return common;
  }

  createLayer(cfg: LayerConfig) {
  const common = this.commonProps(cfg);

  // handle group-like layers (config has nested "layers" arrays)
  if ((cfg as any).layers) {
    return new GroupLayer({
      ...common,
      layers: (cfg as any).layers
        .map((childCfg: LayerConfig) => this.createLayer(childCfg))
        .filter(Boolean) as any[]
    });
  }

  // Set opacity only for supported layer types
  switch (cfg.type) {
    case 'WMSLayer':
      return new WMSLayer({ ...common, url: cfg.url });

    case 'WMTSLayer':
      return new WMTSLayer({ ...common, url: cfg.url });

    case 'FeatureLayer':
      return new FeatureLayer({
        ...common,
        url: cfg.url,
        outFields: cfg.outFields ?? ['*'],
        renderer: cfg.renderer,
        labelingInfo: cfg.labelingInfo,
        labelsVisible: cfg.labelsVisible,
        definitionExpression: cfg.definitionExpression,
        popupTemplate: cfg.popupTemplate
      });

    case 'SceneLayer':
      return new SceneLayer({
        ...common,
        url: cfg.url,
        renderer: cfg.renderer,
        popupTemplate: cfg.popupTemplate
      });

    case 'PointCloudLayer':
      return new PointCloudLayer({
        ...common,
        url: cfg.url,
        renderer: cfg.renderer
      });

    case 'BuildingSceneLayer':
      return new BuildingSceneLayer({
        ...common,
        url: cfg.url
      });

    case 'MapImageLayer':
      return new MapImageLayer({
        ...common,
        url: cfg.url,
        sublayers: cfg.sublayers
      });

    case 'TileLayer':
      return new TileLayer({ ...common, url: cfg.url });

    case 'ImageryTileLayer':
      return new ImageryTileLayer({ ...common, url: cfg.url });

    case 'VectorTileLayer':
      return new VectorTileLayer({
        ...common,
        url: cfg.url,
        portalItem: cfg.portalItem
      });

    case 'IntegratedMeshLayer':
      return new IntegratedMeshLayer({ ...common, url: cfg.url });

    default:
      console.warn('Unknown layer type:', cfg.type, cfg);

    return undefined;
  }
}

  private normalizeElevationInfo(ei: any): any {
    // Your config sometimes uses strings like "relative-to-scene"
    if (typeof ei === 'string') return { mode: ei };
    return ei;
  }

  getLayerByUrl(url: string) {
    if (!this.map) 
      return undefined;

    let found: any = null;
    this.map.allLayers.forEach((lyr: any) => {
      if (found) 
        return;

      if (typeof lyr.url === 'string' && lyr.url?.toLowerCase() === url.toLowerCase()) {
        found = lyr;
      }
    });

    return found;
  }

}
