import { Injectable } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Ground from '@arcgis/core/Ground';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

import SceneView from '@arcgis/core/views/SceneView';

import Layer from '@arcgis/core/layers/Layer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
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
import { AppConfig, EdgeConfig, LabelConfig, LayerConfig } from '../interfaces/config.interface';

import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer';
import ClassBreaksRenderer from '@arcgis/core/renderers/ClassBreaksRenderer';
import PointCloudRGBRenderer from '@arcgis/core/renderers/PointCloudRGBRenderer';
import RasterColormapRenderer from '@arcgis/core/renderers/RasterColormapRenderer';
import RasterShadedReliefRenderer from '@arcgis/core/renderers/RasterShadedReliefRenderer';
import RasterStretchRenderer from '@arcgis/core/renderers/RasterStretchRenderer';

import PopupTemplate from '@arcgis/core/PopupTemplate';
import FieldInfo from '@arcgis/core/popup/FieldInfo';
import { ConfigService } from './config.service';


@Injectable({ providedIn: 'root' })
export class ArcGisService {
  map?: Map;
  mapView?: MapView;
  sceneView?: SceneView;
  appConfig!: AppConfig;

  constructor(private configService: ConfigService) {
    this.appConfig = this.configService.getConfig()!;
  }

  // async initMapView(container: HTMLDivElement, appConfig: AppConfig): Promise<MapView> {
  //   this.appConfig = appConfig;
    async initMapView(container: HTMLDivElement): Promise<MapView> {
    if (!this.map)
       this.createMapFromConfig(this.appConfig);

    const [lon, lat, elev] = this.configService.ViewLonLatElevation;

    this.mapView = new MapView({
      container,
      map: this.map,
      center: [ lon,lat ],
      zoom: elev ?? 1777
    });

    await this.mapView.when();

    return this.mapView;
  }

  // async initSceneView(container: HTMLDivElement, appConfig: AppConfig): Promise<SceneView> {
  //   this.appConfig = appConfig;
  async initSceneView(container: HTMLDivElement): Promise<SceneView> {
    if (!this.map)
      this.createMapFromConfig(this.appConfig);

    const [lon, lat, elev] = this.configService.ViewLonLatElevation ;
    const [heading, tilt, fov] = this.configService.ViewHeadingTiltFov;

    this.sceneView = new SceneView({
      container,
      map: this.map,
      camera: {
        position: { longitude: lon, latitude: lat, z: elev ?? 1777 },
        heading,
        tilt
      },
      qualityProfile: (this.appConfig.viewQualityProfile as any) ?? 'high',
      environment: {
        lighting: { directShadowsEnabled: true, date: this.appConfig.initialDateTime ? new Date(this.appConfig.initialDateTime) : undefined },
        starsEnabled: this.appConfig.starsEnabled ?? true,
        atmosphereEnabled: this.appConfig.atmosphereEnabled ?? true
      },
      popup: { dockEnabled: true, dockOptions: { position: this.appConfig.popupPosition ?? 'top-center' } } 
    });

    await this.sceneView.when();

    return this.sceneView;
  }

  onUpdating(cb: (updating: boolean) => void) {
    if (!this.mapView) 
      return;

    return reactiveUtils.watch(
      () => this.mapView!.updating,
      (u) => cb(u)
    );
  }

  createMapFromConfig(appConfig: AppConfig): Map {
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
      basemap: appConfig.basemap ?? 'streets-vector'
    });

    for (const layerCfg of appConfig.layers ?? []) {
      const layer = this.createLayer(layerCfg);

      if (layer) 
        this.map.add(layer);
    }

    if(appConfig.elevationLayerUrls !== null)
    {
      appConfig.elevationLayerUrls.forEach((item: string) => {
        this.map!.ground.layers.push(new ElevationLayer({
          url: item
        }));
      });
    }

    return this.map;
  }
  

  //CREATE LAYERS

  createSceneLayer(layerConfig: LayerConfig): SceneLayer {

    let sceneLayer = new SceneLayer({
      url: layerConfig.url,
      elevationInfo: this.normalizeElevationInfo(layerConfig.elevationInfo)
    });

    this.setUniversalLayerConfiguration(layerConfig, sceneLayer);

    if (layerConfig.meshSymbol3d) {
      sceneLayer.renderer = new SimpleRenderer({
          symbol: layerConfig.meshSymbol3d
      });
    }

    this.setLegendEnabledToLayer(sceneLayer, layerConfig.legendEnabled ?? true);
    this.setPopupEnabledToLayer(sceneLayer, layerConfig.popupEnabled ?? true);

    if (layerConfig.renderer != null) 
      this.addRendererToLayer(sceneLayer, layerConfig.renderer);

    if (layerConfig.popupDisplayFields != null)
      this.setPopupDisplayFieldsToLayer(sceneLayer, layerConfig.popupDisplayFields);

    this.addDefaultEdgeToLayer(sceneLayer, layerConfig);

    if (layerConfig.castShadows == false) 
        this.removeShadowFromLayer(sceneLayer);    

    return sceneLayer;
  }

  createPointCloudLayer(layerConfig: LayerConfig): PointCloudLayer {
    let rend = new PointCloudRGBRenderer({
        pointSizeAlgorithm: {
            type: "fixed-size",
            size: 5
        },
        pointsPerInch: 25,
        field: "RGB"
    });

    let pointCloudLayer = new PointCloudLayer({
        url: layerConfig.url,
        renderer: rend
    });

    this.setUniversalLayerConfiguration(layerConfig, pointCloudLayer);
    //this.setLegendEnabledToLayer(pointCloudLayer, layerConfig.legendEnabled);

    return pointCloudLayer;
  }

  createFeatureLayer(layerConfig: LayerConfig): FeatureLayer {
    let featureLayer = new FeatureLayer({
        url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, featureLayer);

    if (layerConfig.elevationInfo) {
        featureLayer.elevationInfo = {
            mode: layerConfig.elevationInfo
        };
    }

    this.setLegendEnabledToLayer(featureLayer, layerConfig.legendEnabled ?? true);
    this.setPopupEnabledToLayer(featureLayer, layerConfig.popupEnabled ?? true);

    if (layerConfig.renderer != null) 
      this.addRendererToLayer(featureLayer, layerConfig.renderer);

    if (layerConfig.popupDisplayFields != null)
      this.setPopupDisplayFieldsToLayer(featureLayer, layerConfig.popupDisplayFields);

    if (layerConfig.outFields != null) 
      featureLayer.outFields = layerConfig.outFields;    

    if (layerConfig.definitionExpression != null)
      featureLayer.definitionExpression = layerConfig.definitionExpression;    

    if (layerConfig.labelingInfo != null)
      featureLayer.labelingInfo = layerConfig.labelingInfo;    

    if (layerConfig.labelsVisible != null)
      featureLayer.labelsVisible = layerConfig.labelsVisible;    

    return featureLayer;
  }

  createWMSLayer(layerConfig: LayerConfig): WMSLayer {

    let wmsLayer = new WMSLayer({
        url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, wmsLayer);

    return wmsLayer;
  }

  createWMTSLayer(layerConfig: LayerConfig): WMTSLayer {

    let wmtsLayer = new WMTSLayer({
        url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, wmtsLayer);

    return wmtsLayer;
  }

  createTileLayer(layerConfig: LayerConfig): TileLayer {

    let tileLayer = new TileLayer({
      url: layerConfig.url,
    });

    this.setUniversalLayerConfiguration(layerConfig, tileLayer);

    this.setLegendEnabledToLayer(tileLayer, layerConfig.legendEnabled ?? true);

    return tileLayer;
  }

  createMapImageLayer(layerConfig: LayerConfig): MapImageLayer {

    let mapImageLayer = new MapImageLayer({
        url: layerConfig.url
    });

    if (layerConfig.sublayers != null)
        mapImageLayer.sublayers = layerConfig.sublayers;

    this.setUniversalLayerConfiguration(layerConfig, mapImageLayer);

    return mapImageLayer;
  }

  createVectorTileLayer(layerConfig: LayerConfig): VectorTileLayer {

    let mapVectorLayer = new VectorTileLayer({
      url: layerConfig.url
    });

    if(layerConfig.portalItem != null)
      mapVectorLayer.portalItem = layerConfig.portalItem;

    this.setUniversalLayerConfiguration(layerConfig, mapVectorLayer);

    return mapVectorLayer;
  }

  createImageryTileLayer(layerConfig: LayerConfig): ImageryTileLayer {

    let mapImageryLayer = new ImageryTileLayer({
        url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, mapImageryLayer);

    this.setLegendEnabledToLayer(mapImageryLayer, layerConfig.legendEnabled ?? true);
    this.setPopupEnabledToLayer(mapImageryLayer, layerConfig.popupEnabled ?? true);

    if (layerConfig.renderer != null) 
      this.addRendererToLayer(mapImageryLayer, layerConfig.renderer);

    if (layerConfig.popupDisplayFields != null)
      this.setPopupDisplayFieldsToLayer(mapImageryLayer, layerConfig.popupDisplayFields);

    return mapImageryLayer;
  }

  createIntegratedMeshLayer(layerConfig: LayerConfig): IntegratedMeshLayer {

    let imLayer = new IntegratedMeshLayer({
      url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, imLayer);

    return imLayer;
  }

  createBuildingSceneLayer(layerConfig: LayerConfig): BuildingSceneLayer {

    let bsLayer = new BuildingSceneLayer({
      url: layerConfig.url
    });

    this.setUniversalLayerConfiguration(layerConfig, bsLayer);

    return bsLayer;
  }


  createLayer(layerConfig: LayerConfig) {

    // handle group-like layers (config has nested "layers" arrays)
    if ((layerConfig as any).layers) {
      let groupLayer = new GroupLayer({
        visibilityMode: layerConfig.visibilityMode != null ? layerConfig.visibilityMode : 'independent',
        listMode: layerConfig.listMode != null ? layerConfig.listMode : "hide-children",
        layers: (layerConfig as any).layers
          .map((childCfg: LayerConfig) => this.createLayer(childCfg))
          .filter(Boolean) as any[]
      });

      this.setUniversalLayerConfiguration(layerConfig, groupLayer);

      return groupLayer;
    }

    // Set opacity only for supported layer types
    switch (layerConfig.type) {

      case 'SceneLayer':
        return this.createSceneLayer(layerConfig);

      case 'PointCloudLayer':
        return this.createPointCloudLayer(layerConfig);

      case 'FeatureLayer':
        return this.createFeatureLayer(layerConfig);

      case 'WMSLayer':
        return this.createWMSLayer(layerConfig);

      case 'WMTSLayer':
        return this.createWMTSLayer(layerConfig);

      case 'TileLayer':
        return this.createTileLayer(layerConfig);

      case 'MapImageLayer':
        return this.createMapImageLayer(layerConfig);

      case 'VectorTileLayer':
        return this.createVectorTileLayer(layerConfig);

      case 'ImageryTileLayer':
        return this.createImageryTileLayer(layerConfig);

      case 'IntegratedMeshLayer':
        return this.createIntegratedMeshLayer(layerConfig);

      case 'BuildingSceneLayer':
        return this.createBuildingSceneLayer(layerConfig);

      default:
        console.warn('Unknown layer type:', layerConfig.type, layerConfig);

      return undefined;
    }
  }

  //CREATE LAYERS


  //HELPERS

  setUniversalLayerConfiguration(layerConfig: LayerConfig, layer: Layer): void {
      if (layerConfig.title != null)
          layer.title = layerConfig.title;

      if (layerConfig.visible != null)
          layer.visible = layerConfig.visible;      

      if (layerConfig.opacity != null)
          layer.opacity = layerConfig.opacity;

      if (layerConfig.listMode != null)
          layer.listMode = layerConfig.listMode;      

      this.setShowFullExtentButtonToLayer(layer, layerConfig.showZoomToFullExtentButton ?? true);
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

  setLegendEnabledToLayer(layer: FeatureLayer | SceneLayer | TileLayer | ImageryTileLayer, enabled: boolean): void {
    // TODO: CSV, Stream, Sublayer, WMS, WMSSublayer have legend enabled property too

    if (enabled != null) {
        if (enabled == true || enabled == false)
            layer.legendEnabled = enabled;
        else
            console.error("Invalid value set for legend enabled for layer", enabled, layer);
    }
  }

  setPopupEnabledToLayer(layer: FeatureLayer | SceneLayer | ImageryTileLayer, enabled: boolean): void {
    // TODO: CSV, Imagery, Stream, WMSSublayer have popup enabled property too

    if (enabled != null) {
        if (enabled == true || enabled == false)
            layer.popupEnabled = enabled;
        else
            console.error("Invalid value set for popup enabled for layer", enabled, layer);
    }
  }

  // Removed PointCloudLayer because it threw an error that it doesnt have legendEnabled property
  addRendererToLayer(layer: FeatureLayer | SceneLayer | ImageryTileLayer, renderer: SimpleRenderer | UniqueValueRenderer | ClassBreaksRenderer | RasterStretchRenderer | RasterShadedReliefRenderer | RasterColormapRenderer): void {
    // TODO: Renderers can be added to MapImage, CSV and Stream layers too
    // TODO: Check if object sent is actually a instance of renderer
    if (renderer != null)
        layer.renderer = renderer;
  }

  // If poput out fields not set in cfg, loads template from server
  // If popup out fields set as popupOutFields = [["*"]] in config builds template from all fields on the layer
  // If fieldName-label pairs are set they are displayed, if only fieldName is set but not label, label will inherit the value from the fieldName
  // Examples: popupOutFields = [["height","Visina drveta"], ["width"]] -- height field will display as "Visina drveta" while width field will display as "width"
  setPopupDisplayFieldsToLayer(layer: FeatureLayer | SceneLayer | ImageryTileLayer, popupDisplayFields: Record<string, LabelConfig>): void {
    // TODO: CSVLayer, Graphic, ImageryLayer, StreamLayer, Sublayer
    if (popupDisplayFields != null) {
      // When popupOutFields=["*"] in config.json, we want to build custom template

      // We need to wait for layer to be loaded from service then we can read its fields
      layer.when((loadedLayer: { popupEnabled: boolean; popupTemplate: PopupTemplate; title: any; }) => {
          loadedLayer.popupEnabled = true;
          // Create new popup template on layer
          loadedLayer.popupTemplate = new PopupTemplate({
              title: loadedLayer.title,
              content: [{
                  type: 'fields'
              }],
              fieldInfos: []
          });
          // Clear fields that may already be on layer
          loadedLayer.popupTemplate.fieldInfos = [];
          // Set each field on layer to template
          Object.keys(popupDisplayFields)
              .forEach(key => {
              const fieldInfo = new FieldInfo({
                  fieldName: key,
                  label: popupDisplayFields[key].label != null ? popupDisplayFields[key].label : key,
                  format: popupDisplayFields[key].format,
                  visible: true
              });
              loadedLayer.popupTemplate.fieldInfos!.push(fieldInfo);
          });
      }); // -- layer.when
    }
  }

  addDefaultEdgeToLayer(layer: SceneLayer, layerConfig: LayerConfig): SceneLayer {

        const edgeType = layerConfig.defaultEdge;

        if (layer.renderer == null) {
            layer.on('layerview-create', (layerView) => {
                switch (edgeType) {
                    case ("solid"): {
                        let solidRenderer = (layer.renderer as any).clone();
                        if (solidRenderer.type == "simple") {
                            solidRenderer.symbol.symbolLayers.getItemAt(0).edges = layerConfig.solidEdge != null ? layerConfig.solidEdge : this.appConfig.solidEdge;
                        } else if (solidRenderer.type == "unique-value") {
                            solidRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: any; }; }; }; }) => {
                                uvi.symbol.symbolLayers.getItemAt(0).edges = layerConfig.solidEdge != null ? layerConfig.solidEdge : this.appConfig.solidEdge;
                            });
                        } else {
                            console.error("Renderer type not supported");
                        }
                        layer.renderer = solidRenderer;
                        break;
                    }
                    case ("sketch"): {
                        let sketchRenderer = (layer.renderer as any).clone();
                        if (sketchRenderer.type == "simple") {
                            sketchRenderer.symbol.symbolLayers.getItemAt(0).edges = layerConfig.sketchEdge != null ? layerConfig.sketchEdge : this.appConfig.sketchEdge;
                        } else if (sketchRenderer.type == "unique-value") {
                            sketchRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: any; }; }; }; }) => {
                                uvi.symbol.symbolLayers.getItemAt(0).edges = layerConfig.sketchEdge != null ? layerConfig.sketchEdge : this.appConfig.sketchEdge;
                            });
                        } else {
                            console.error("Renderer type not supported");
                        }
                        layer.renderer = sketchRenderer;
                        break;
                    }
                    default: {
                        let noEdgeRenderer = (layer.renderer as any).clone();
                        if (noEdgeRenderer.type == "simple") {
                            noEdgeRenderer.symbol.symbolLayers.getItemAt(0).edges = null;
                        } else if (noEdgeRenderer.type == "unique-value") {
                            noEdgeRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: null; }; }; }; }) => {
                                uvi.symbol.symbolLayers.getItemAt(0).edges = null;
                            });
                        } else {
                            console.error("Renderer type not supported");
                        }
                        layer.renderer = noEdgeRenderer;
                        break;
                    }
                }
            });
            return layer;
        }

        switch (edgeType) {
            case ("solid"): {
                let solidRenderer = (layer.renderer as any).clone();
                if (solidRenderer.type == "simple") {
                    solidRenderer.symbol.symbolLayers.getItemAt(0).edges = this.appConfig.solidEdge;
                } else if (solidRenderer.type == "unique-value") {
                    solidRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: EdgeConfig; }; }; }; }) => {
                        uvi.symbol.symbolLayers.getItemAt(0).edges = this.appConfig.solidEdge;
                    });
                } else {
                    console.error("Renderer type not supported");
                }
                layer.renderer = solidRenderer;
                break;
            }
            case ("sketch"): {
                let sketchRenderer = (layer.renderer as any).clone();
                if (sketchRenderer.type == "simple") {
                    sketchRenderer.symbol.symbolLayers.getItemAt(0).edges = this.appConfig.sketchEdge;
                } else if (sketchRenderer.type == "unique-value") {
                    sketchRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: EdgeConfig; }; }; }; }) => {
                        uvi.symbol.symbolLayers.getItemAt(0).edges = this.appConfig.sketchEdge;
                    });
                } else {
                    console.error("Renderer type not supported");
                }
                layer.renderer = sketchRenderer;
                break;
            }
            default: {
                let noEdgeRenderer = (layer.renderer as any).clone();
                if (noEdgeRenderer.type == "simple") {
                    noEdgeRenderer.symbol.symbolLayers.getItemAt(0).edges = null;
                } else if (noEdgeRenderer.type == "unique-value") {
                    noEdgeRenderer.uniqueValueInfos.forEach((uvi: { symbol: { symbolLayers: { getItemAt: (arg0: number) => { (): any; new(): any; edges: null; }; }; }; }) => {
                        uvi.symbol.symbolLayers.getItemAt(0).edges = null;
                    });
                } else {
                    console.error("Renderer type not supported");
                }
                layer.renderer = noEdgeRenderer;
                break;
            }
        }

        return layer;
    }

  removeShadowFromLayer(layer: SceneLayer): void {
    if (layer.renderer == null) {

      layer.on('layerview-create', (layerView) => {
        let renderer = (layer.renderer as any).clone();
        renderer.symbol.symbolLayers.getItemAt(0).castShadows = false;
        layer.renderer = renderer;
      });

      return;
    }

    let renderer = (layer.renderer as any).clone();
    renderer.symbol.symbolLayers.getItemAt(0).castShadows = false;
    layer.renderer = renderer;
  }

  setShowFullExtentButtonToLayer(layer: Layer, show: boolean) {
    if (show != null && show !== true && show !== false)
      console.error("Invalid value set for showFullExtentButton on layer", show, layer);
  }

  //HELPERS
}
