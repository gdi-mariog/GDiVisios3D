import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { AppConfig } from '../interfaces/config.interface';

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
    if (!config) return undefined;

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
      title: 'GDiVisios3D',
      subtitle: '',
      tenantLogoUri: '',
      gdiLogoUri: '',
      appVersion: '1.0.0',
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
      tocPanelActive: true,
      showSliceWidget: false,
      showBuildingExplorerWidget: false,
      showLineOfSightWidget: false,
      showElevationProfileWidget: false,
      'theme-bg': 'theme-bg',
      'theme-text': 'theme-text',
      urlPrefix: [],
      proxyUrl: '',
      supportedLayerTypes: '',
      spatialWkid: '102100',
      basemap: 'osm',
      layerListGoToFullExtentButtonsEnabled: true,
      layers: []
    };
  }
}
