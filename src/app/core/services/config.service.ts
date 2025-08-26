import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { AppConfig, AtmosphereQualityMode, AtmosphereQualityModes, ViewQualityProfileMode, ViewQualityProfileModes } from '../interfaces/config.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<AppConfig | null>(null);
  private isLoadedSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public config$ = this.configSubject.asObservable();
  public isLoaded$ = this.isLoadedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load configuration from JSON file
   * @param configPath Path to configuration file (default: assets/configuration/config-files/config_4_20_2.json)
   */
  loadConfig(configPath = 'configuration/config-files/config_4_20_2.json'): Observable<AppConfig> {
    return this.http.get<AppConfig>(configPath).pipe(
      tap(config => {
        this.configSubject.next(config);
        this.isLoadedSubject.next(true);
        console.log('Configuration loaded successfully:', config.title);
      }),
      catchError(error => {
        console.error('Failed to load configuration:', error);
        this.isLoadedSubject.next(false);
        // Return a default/fallback configuration
        return of(this.getDefaultConfig());
      })
    );
  }

  /**
   * Get current configuration synchronously
   */
  getConfig(): AppConfig | null {
    return this.configSubject.value;
  }

  /**
   * Get a specific configuration value by path
   * @param path Dot-notation path to the configuration value (e.g., 'camera.position.x')
   */
  getValue<T>(path: string): T | undefined {
    const config = this.getConfig();
    if (!config) 
      return undefined;

    return this.getNestedValue(config, path) as T;
  }

  /**
   * Check if configuration is loaded
   */
  isConfigLoaded(): boolean {
    return this.isLoadedSubject.value;
  }

  /**
   * Get layers configuration
   */
  getLayers(): Observable<any[]> {
    return this.config$.pipe(
      map(config => config?.layers || [])
    );
  }

  /**
   * Get a specific layer by ID
   */
  getLayerById(layerId: string): Observable<any | undefined> {
    return this.config$.pipe(
      map(config => {
        if (!config?.layers) return undefined;
        return this.findLayerInHierarchy(config.layers, layerId);
      })
    );
  }

  /**
   * Get widget configuration
   */
  getWidgetConfig(): Observable<any> {
    return this.config$.pipe(
      map(config => {
        if (!config) return {};
        return {
          showSliceWidget: config.showSliceWidget,
          showBuildingExplorerWidget: config.showBuildingExplorerWidget,
          showLineOfSightWidget: config.showLineOfSightWidget,
          showElevationProfileWidget: config.showElevationProfileWidget,
          showBookmarksPanel: config.showBookmarksPanel,
          tocPanelActive: config.tocPanelActive
        };
      })
    );
  }

  /**
   * Get camera configuration
   */
  getCameraConfig(): Observable<any | undefined> {
    return this.config$.pipe(
      map(config => config?.camera)
    );
  }

  /**
   * Get bookmarks configuration
   */
  getBookmarks(): Observable<any[]> {
    return this.config$.pipe(
      map(config => config?.bookmarks || [])
    );
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const currentConfig = this.getConfig();

    if (currentConfig) {
      const updatedConfig = { ...currentConfig, ...updates };
      this.configSubject.next(updatedConfig);
    }
  }

  // Private helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private findLayerInHierarchy(layers: any[], layerId: string): any | undefined {
    for (const layer of layers) {
      if (layer.id === layerId) {
        return layer;
      }
      // Check nested layers
      if (layer.layers) {
        const found = this.findLayerInHierarchy(layer.layers, layerId);
        if (found) return found;
      }
      // Check sublayers
      if (layer.sublayers) {
        const found = this.findLayerInHierarchy(layer.sublayers, layerId);
        if (found) return found;
      }
    }
    return undefined;
  }

  private getDefaultConfig(): AppConfig {
    return {
  title: 'Smart3D',
  subtitle: '',
  tenantLogoUri: '',
  gdiLogoUri: '',
  appVersion: '',

  modalFooterLeftDestination: '',
  modalFooterLeftText: '',
  modalFooterRightLogoUri: '',
  modalFooterRightDestination: '',

  helpModalContentUri: '',
  welcomeModalContentUri: '',
  aboutModalContentUri: '',
  releaseNotesModalContentUri: '',

  circleUri: '',
  lineUri: '',
  multipleUri: '',
  pointUri: '',
  polygonUri: '',

  showWelcomeModal: false,
  showBookmarksPanel: false,
  tocPanelActive: false,
  showSliceWidget: false,
  sliceConfig: {
    enabled: false,
    position: 'top-left',
    tiltEnabled: false,
    excludeGroundSurface: false,
    defaultShape: 'plane',
    showShapeButtons: false,
    showTiltControls: false,
    showGroundExclusionToggle: false
  },
  showBuildingExplorerWidget: false,
  showLineOfSightWidget: false,
  showElevationProfileWidget: false,

  'theme-bg': 'theme-bg',
  'theme-text': 'theme-text',

  urlPrefix: [],
  proxyUrl: '',
  supportedLayerTypes: '',
  spatialWkid: '',
  basemap: '',
  layerListGoToFullExtentButtonsEnabled: false,

  initialDateTime: '',
  shadowsEnabled: false,
  waterReflection: false,
  ambientOcclusionEnabled: false,
  viewLonLatElevation: [],
  viewHeadingTiltFOV: [],

  initialCircleRadius: 1,
  minCircleRadius: 1,
  maxCircleRadius: 1,
  circleRadiusUnit: '',

  viewQualityProfile: 'high',
  atmosphereEnabled: false,
  atmosphereQuality: 'high',
  starsEnabled: false,

  viewHighlightColor: '',
  viewHighlightHaloOpacity: '',
  viewHighlightFillOpacity: '',

  popupPosition: '',

  selectToolEnabled: false,
  selectToolOutFields: [],

  bookmarks: [],

  selectToolAnalysisOperations: [],
  selectToolAnalysisOperationalLabels: [],

  drawToolEnabled: false,
  measureToolEnabled: false,
  measureToolOutFields: [],

  solidEdge: {
    type: '',
    color: [],
    size: 1,
    extensionLength: 1
  },
  sketchEdge: {
    type: '',
    color: [],
    size: 1,
    extensionLength: 1
  },

  measureToolPointSymbol: {
    symbolLayers: []
  },
  measureToolLineSymbol: {
    symbolLayers: []
  },
  selectToolPolygonSymbol: {
    color: [],
    style: '',
    outline: {
	  color: [],
	  size: 1,
	  width: 1
    }
	},
  selectToolCircleSymbol: {
    color: [],
    style: '',
    outline: {
	  color: [],
	  size: 1,
	  width: 1
    }
	},
  selectToolPointSymbol: {
    color: [],
    style: '',
    outline: {
      color: [],
      size: 1,
      width: 1
    }
  },

  geometryServiceUrl: '',
  projectionSpatialReferenceWkid: 0,
  elevationLayerUrls: [],
  layers: [],
  camera: {
    position: {
      x: 1,
      y: 1,
      z: 1,
      spatialReference: { wkid: 1 },
    },
    heading: 1,
    tilt: 1
  },
  drawToolPointSymbol: null,
  drawToolLineSymbol: null,
  drawToolPolygonSymbol: null
    };
  }

  //-- -------------------------------------------------- --//
  //-- getters --//

  get BgClass(): string {
    //return this.getConfig()?.['theme-bg'] ?? '';
    return 'theme-bg';
  }

  get TxtClass(): string {
    //return this.getConfig()?.['theme-text'] ?? '';
    return 'theme-text';
  }

  get ViewLonLatElevation(): number[] {
    return this.getConfig()?.viewLonLatElevation ?? [15.9793, 45.7776, 1777];
  }

  get ViewHeadingTiltFov(): number[] {
      return this.getConfig()?.viewHeadingTiltFOV ?? [0, 0, 55];
  }

  get ViewHighlightHaloOpacity(): number {
    return Number(this.getConfig()?.viewHighlightHaloOpacity ?? 0.4);
  }

  get ViewHighlightFillOpacity(): number {
    return Number(this.getConfig()?.viewHighlightFillOpacity ?? 0.4);
  }

  get ViewHighlightColor(): string {
    return this.getConfig()?.viewHighlightColor ?? '#501236';
  }

  get ViewQualityProfile(): ViewQualityProfileMode {
    return this.pickConfig("viewQualityProfile", "high", ViewQualityProfileModes);
  }

  get AtmosphereEnabled(): boolean {
    return this.pickConfig("atmosphereEnabled", true);
  }

  get AtmosphereQuality(): AtmosphereQualityMode {
    return this.pickConfig("atmosphereQuality", "high", AtmosphereQualityModes);
  }

  get StarsEnabled(): boolean {
    return this.pickConfig("starsEnabled", true);
  }

  get ShadowsEnabled(): boolean {
    return this.pickConfig("shadowsEnabled", true);
  }

  get WaterReflection(): boolean {
    return this.pickConfig("waterReflection", true);
  }

  get AmbientOcclusionEnabled(): boolean {
    return this.pickConfig("ambientOcclusionEnabled", true);
  }

  get InitialDateTime(): Date {
    let dateTime = this.getConfig()?.initialDateTime;
    if (dateTime == null)
      return new Date("October 16, 2017 13:00:00");

    return new Date(dateTime);
  }

  get LayerListGoToFullExtentButtonsEnabled(): boolean {
    return this.pickConfig("layerListGoToFullExtentButtonsEnabled", true);
  }

  get MeasureToolEnabled(): boolean {
    return this.pickConfig("measureToolEnabled", false);
  }

  get DrawToolEnabled(): boolean {
    return this.pickConfig("drawToolEnabled", false);
  }

  get SelectToolEnabled(): boolean {
    return this.pickConfig("selectToolEnabled", false);
  }

  get SelectToolOutFields(): string[] {
    let outFields = this.getConfig()?.selectToolOutFields;
    if (outFields == null)
      return ['*'];

    return outFields;
  }

  get SelectToolAnalysisOperations(): string[] {
    let operations = this.getConfig()?.selectToolAnalysisOperations;
    if (operations == null)
      return ['SUM'];

     return operations;
  }

  get SelectToolAnalysisOperationalLabels(): string[] {
    let fields = this.getConfig()?.selectToolAnalysisOperationalLabels;
    if (fields == null) 
        return [];// when null is returned, selectTool won't filter with values from cfg

    return fields;
  }

  get InitialCircleRadius(): number {
    return Number(this.getConfig()?.initialCircleRadius ?? 0);
  }

  get MaxCircleRadius(): number {
    return Number(this.getConfig()?.maxCircleRadius ?? 0);
  }

  get MinCircleRadius(): number {
    return Number(this.getConfig()?.minCircleRadius ?? 0);
  }

  get MeasureToolOutFields(): string[] {
    let outFields = this.getConfig()?.measureToolOutFields;
    if (outFields == null) 
        return [];

    return outFields;
  }


  //-- -------------------------------------------------- --//
  //-- helpers --//
  private pickConfig<K extends keyof AppConfig>(
      key: K,
      defaultValue: NonNullable<AppConfig[K]>,
      validValues?: readonly NonNullable<AppConfig[K]>[]
    ): NonNullable<AppConfig[K]> {
    const cfg = this.getConfig();
    const value = cfg?.[key];

    if (value == null) {
      console.log(`${String(key)} not set in config.json, using default: ${defaultValue}`);
      return defaultValue;
    }

      // Type check vs defaultValue’s type (covers boolean, string unions, numbers, etc.)
    if (typeof value !== typeof defaultValue) {
      console.error(
        `Invalid type for ${String(key)} in config.json; expected ${typeof defaultValue}. ` +
        `Using default: ${defaultValue}`,
        value
      );
      return defaultValue;
    }

    if (validValues && !validValues.includes(value as any)) {
      console.error(
        `Invalid value for ${String(key)} in config.json. ` +
        `Valid values: ${validValues.join(", ")}. Using default: ${defaultValue}`,
        value
      );

      return defaultValue;
    }

    return value as NonNullable<AppConfig[K]>;
  }
}
