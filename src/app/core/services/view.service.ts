import { Injectable } from '@angular/core';
import Color from '@arcgis/core/Color';
import Point from '@arcgis/core/geometry/Point';
import Extent from '@arcgis/core/geometry/Extent';
import Camera from '@arcgis/core/Camera';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';

import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import Home from '@arcgis/core/widgets/Home';
// import Slice from '@arcgis/core/widgets/Slice'; // Deprecated, replaced by SliceComponent
import BuildingExplorer from '@arcgis/core/widgets/BuildingExplorer';
// import LineOfSight from '@arcgis/core/widgets/LineOfSight'; // Deprecated, replaced by LineOfSight component
import ElevationProfile from '@arcgis/core/widgets/ElevationProfile';
import ElevationProfileLineGround from '@arcgis/core/widgets/ElevationProfile/ElevationProfileLineGround';
import ElevationProfileLineView from '@arcgis/core/widgets/ElevationProfile/ElevationProfileLineView';

import Query from '@arcgis/core/rest/support/Query';

import { AppConfig } from '../interfaces/config.interface';
import { ArcGisService } from './arcgis.service';

type AnyView = SceneView | MapView;

@Injectable({ providedIn: 'root' })
export class ViewService {
  /** Called after the view is constructed and .when() resolved */
  onViewInitialized?: () => void;

  private _view!: SceneView;
  private _initialized = false;

  // Widgets
  // private sliceWidget: Slice | null = null; // Deprecated
  private buildingExplorerWidget: BuildingExplorer | null = null;
  // private lineOfSightWidget: LineOfSight | null = null; // Deprecated
  private elevationProfileWidget: ElevationProfile | null = null;

  constructor(private arcgis: ArcGisService) {}

  /** Parse URL params (fallback to window.location if needed) */
  private getQueryParam(name: string): string | null {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    } catch {
      return null;
    }
  }

  /** Build camera from url params if present */
  private cameraFromUrl(): Camera | null {
    const x = this.getQueryParam('x');
    const y = this.getQueryParam('y');
    const z = this.getQueryParam('z');
    const heading = this.getQueryParam('heading');
    const tilt = this.getQueryParam('tilt');
    const fov = this.getQueryParam('fov');

    if ([x, y, z, heading, tilt, fov].some(v => v === null)) return null;

    return new Camera({
      position: new Point({
        x: Number(x),
        y: Number(y),
        z: Number(z),
        hasZ: true,
        spatialReference: new SpatialReference({ wkid: 102100 })
      }),
      heading: Number(heading),
      tilt: Number(tilt),
      fov: Number(fov)
    });
  }

  /**
   * Create and initialize a SceneView using the already-created Map in ArcgisService.
   * Honors config (lighting, atmosphere, popup dock position, quality, etc.)
   */
  async load(container: HTMLDivElement, cfg: AppConfig): Promise<SceneView> {
    if (!this.arcgis.map) {
      // Build the map (layers from config) if not created yet.
      this.arcgis.createMapFromConfig(cfg);
    }

    const urlCamera = this.cameraFromUrl();
    const [lon, lat, elev] = cfg.viewLonLatElevation ?? [15.9793, 45.7776, 1200];
    const [heading, tilt, fov] = cfg.viewHeadingTiltFOV ?? [0, 66, 55];

    this._view = new SceneView({
      container,
      map: this.arcgis.map,
      camera: urlCamera ?? new Camera({
        position: new Point({ x: lon, y: lat, z: elev, hasZ: true }),
        heading,
        tilt,
        fov
      }),
      qualityProfile: (cfg.viewQualityProfile as any) ?? 'high',
      environment: {
        lighting: {
          type: 'sun',
          date: cfg.initialDateTime ? new Date(cfg.initialDateTime) : undefined,
          directShadowsEnabled: cfg.shadowsEnabled ?? true,
          cameraTrackingEnabled: true
        },
        atmosphereEnabled: cfg.atmosphereEnabled ?? true,
        starsEnabled: cfg.starsEnabled ?? true
      },
      highlightOptions: {
        color: cfg.viewHighlightColor ? new Color(cfg.viewHighlightColor) : new Color([17,112,214]),
        fillOpacity: Number(cfg.viewHighlightFillOpacity ?? 0.7),
        haloOpacity: Number(cfg.viewHighlightHaloOpacity ?? 0.7)
      },
      ui: {
        components: ['attribution', 'navigation-toggle', 'compass', 'zoom'],
        padding: 0
      },
      padding: { left: 15, right: 15, top: 15, bottom: 0 },
      popup: {
        dockEnabled: true,
        dockOptions: this.mapPopupPos(cfg.popupPosition)
      }
    });

    // Home widget
    this._view.ui.add(new Home({ view: this._view }), 'top-left');

    await this._view.when();

    // Once the view is ready: load layers (if your arcgis service defers anything)
    // and zoom to object by URL, if present
    this._initialized = true;
    this.zoomToQueryObject().catch(console.warn);

    this.onViewInitialized?.();

    return this._view;
  }

  /**
   * Zoom to a feature by URL params: ?viewService=<layerUrl>&key=<field>&value=<id>
   * Then highlights it in the layer view.
   */
  async zoomToQueryObject(): Promise<void> {
    const viewServiceUrl = this.getQueryParam('viewService');
    if (!viewServiceUrl) return;

    // Try to find a layer by URL (ArcgisService should expose a helper)
    const layer = this.arcgis.getLayerByUrl
      ? this.arcgis.getLayerByUrl(viewServiceUrl)
      : this.findLayerByUrlFallback(viewServiceUrl);

    if (!layer) return;

    // Build query
    const key = this.getQueryParam('key') ?? '';
    const value = this.getQueryParam('value') ?? '';
    if (!key || !value) return;

    const q = new Query({
      outFields: ['*'],
      returnGeometry: true,
      where: `${key}=${value}`
    });

    // Zoom to extent
    try {
      const res = await (layer as any).queryExtent(q);
      if (res?.extent) {
        const ext = (res.extent as Extent).clone();
        await this._view.goTo(ext.expand(1.5));
      }
    } catch (err) {
      console.warn('queryExtent failed:', err);
    }

    // Highlight in layer view
    try {
      const lyrView = await this._view.whenLayerView(layer as any);
      const highlight = (lyrView as any).highlight(Number(value));
      this._view.focus();
      this._view.on('blur', () => (highlight as any)?.remove());
    } catch (err) {
      console.warn('highlight failed:', err);
    }
  }

  /** Fallback search for a layer by URL if ArcgisService doesn't expose a helper */
  private findLayerByUrlFallback(url: string) {
    let found: any = null;

    if (!this.arcgis.map) return undefined;

    this.arcgis.map.allLayers.forEach((lyr: any) => {
      if (found) return;
      if (typeof (lyr as any).url === 'string' && (lyr as any).url?.toLowerCase() === url.toLowerCase()) {
        found = lyr;
      }
    });
    return found;
  }

  // ======== Simple view API, matching your old service ========

  get View(): SceneView { return this._view; }

    get Month(): number {
    const sun = this.sun;
    return sun?.date?.getMonth?.() ?? new Date().getMonth();
    }
set Month(v: number) {
  const sun = this.sun;
  if (!sun) return;
  const d = sun.date ? new Date(sun.date) : new Date();
  d.setMonth(v);
  sun.date = d; // ok after narrowing to SunLighting
}

get Hour(): number {
  const sun = this.sun;
  return sun?.date?.getHours?.() ?? new Date().getHours();
}
set Hour(v: number) {
  const sun = this.sun;
  if (!sun) return;
  const d = sun.date ? new Date(sun.date) : new Date();
  d.setHours(v);
  sun.date = d;
}

get DirectShadows(): boolean {
  const sun = this.sun;
  return !!sun?.directShadowsEnabled;
}
set DirectShadows(value: boolean) {
  const sun = this.sun;
  if (!sun) return;
  sun.directShadowsEnabled = value;
}

  goToPoint(longitude: number, latitude: number) {
    const center = this._view.center.clone();
    center.longitude = longitude;
    center.latitude = latitude;
    this._view.goTo(center);
  }

  goToPolyline(extent: Extent) {
    this._view.goTo({ target: extent.clone().expand(1.5) });
  }

  goToBookmark(bookmark: any) {
    const [x, y, z] = bookmark.viewLonLatElevation;
    const [heading, tilt, fov] = bookmark.viewHeadingTiltFOV;
    const cam = new Camera({
      position: new Point({ x, y, z, hasZ: true }),
      heading, tilt, fov
    });
    this._view.goTo(cam);
  }

  refresh() {
    const cam = this._view.camera.clone();    

    if(!this._view.camera.position.z) 
        return;

    cam.position.z = this._view.camera.position.z + 0.00001;
    this._view.camera = cam;
  }

  // ======== Widgets (add/destroy) ========

  // Deprecated Slice widget methods removed. Use SliceComponent in the map component instead.

  addBuildingExplorerWidget() {
    if (this.buildingExplorerWidget)
      return;

    if (!this.arcgis.map || !this._view)
      return;

    const buildingLayers: any[] = [];
    this.arcgis.map.allLayers.forEach((layer: any) => {
      if (layer.type === 'building-scene')
        buildingLayers.push(layer);
    });

    this.buildingExplorerWidget = new BuildingExplorer({ view: this._view, layers: buildingLayers as any });
    if (this._view && this._view.ui) {
      this._view.ui.add(this.buildingExplorerWidget, 'top-left');
    }
  }

  destroyBuildingExplorerWidget() {
    this.buildingExplorerWidget?.destroy();
    this.buildingExplorerWidget = null;
  }

  // Deprecated LineOfSight widget methods removed. Use LineOfSight component in the map component instead.

  addElevationProfileWidget() {
    if (this.elevationProfileWidget) return;
    if (!this._view) return;
    this.elevationProfileWidget = new ElevationProfile({
      view: this._view,
      profiles: [
        new ElevationProfileLineGround(),
        new ElevationProfileLineView()
      ],
      visibleElements: { selectButton: false }
    });
    if (this._view && this._view.ui) {
      this._view.ui.add(this.elevationProfileWidget, 'top-left');
    }
  }
  destroyElevationProfileWidget() {
    this.elevationProfileWidget?.destroy();
    this.elevationProfileWidget = null;
  }

  mapPopupPos(pos?: string): __esri.PopupDockOptions  {
    switch (pos) {
        case 'top-left':
        case 'top-right':
        case 'bottom-left':
        case 'bottom-right':
        return { position: pos };
        // legacy / unsupported -> pick a sensible default
        case 'top-center':
        default:
        return { position: 'top-right' };
    }
  }

  private get sun(): __esri.SunLighting | null {
    const l = this._view.environment.lighting;

    return l.type === 'sun' ? l : null;
  }

}
