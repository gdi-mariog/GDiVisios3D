import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';

import { SliceComponent } from '../slice/slice.component';
import { ConfigService } from '../../../core/services/config.service';
import { AppConfig } from '../../../core';
import { ArcGisService } from '../../../core/services/arcgis.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, SliceComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('viewDiv', { static: true }) viewDiv!: ElementRef;
  private el = inject(ElementRef<HTMLElement>);

  public static map: Map;
  public static view: SceneView;
  public view: SceneView | null = null;
  public appConfig: AppConfig | null = null;

  // Widget visibility flags from config
  showSliceWidget: boolean = false;
  sliceConfig: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private configService: ConfigService,
    private arcgisService: ArcGisService
  ) {}

  async ngOnInit() {
    // Wait for config to load before initializing map
    this.configService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      if (config && !this.view) {
        this.initializeOnlyMap(config);
      }
    });

    const container = this.el.nativeElement.querySelector('.map') as HTMLDivElement;
    await this.arcgisService.init(MapComponent.map, container, [15.978, 45.492], 6);

    await this.arcgisService.addElevationLayer('https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      {
        visible: true,
        title: 'Terrain 3D Layer',
      }
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.view) {
      this.view.destroy();
    }
  }

  private async initializeOnlyMap(config: AppConfig) {
    this.appConfig = config;

    const map = new Map({
      basemap: config.basemap || 'streets-vector',
    });

    MapComponent.map = map;
  }

  private async initializeMap(config: AppConfig) {
    try {
      // Load widget configuration
      this.showSliceWidget = config.showSliceWidget || false;
      this.sliceConfig = config.sliceConfig || {
        enabled: true,
        position: 'top-right',
        tiltEnabled: true,
        excludeGroundSurface: false,
        defaultShape: 'plane',
        showShapeButtons: true,
        showTiltControls: true,
        showGroundExclusionToggle: true
      };

      const terrain3dElevationLayer = new ElevationLayer({
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
        visible: true,
        title: 'Terraing 3D Layer',
      });

      const zgDtm2024ElevationLayer = new ElevationLayer({
        url: 'https://tiles.arcgis.com/tiles/srGsjgmVH7sYUOi4/ArcGIS/rest/services/ZG_DTM_2024/ImageServer',
        visible: true,
        title: 'ZG DTM 2024 Layer',
      });

      const zg3dLod22024SceneLayer = new SceneLayer({
        url: 'https://services1.arcgis.com/srGsjgmVH7sYUOi4/ArcGIS/rest/services/ZG3D_LOD2_2024/SceneServer/layers/0/',
        elevationInfo: { mode: 'on-the-ground' }
      });

      const map = new Map({
        basemap: config.basemap || 'streets-vector',
        layers: [
          terrain3dElevationLayer,
          zgDtm2024ElevationLayer,
          zg3dLod22024SceneLayer
        ],
      });

      // Use camera config from configuration if available
      const cameraConfig = config.camera || {
        heading: -2,
        position: { x: 15.9793, y: 45.7776, z: 1100 },
        tilt: 75
      };

      this.view = new SceneView({
        container: this.viewDiv.nativeElement,
        map,
        center: [15.979600, 45.789081], // Zagreb
        zoom: 13,
        qualityProfile: 'high',
        environment: { lighting: { directShadowsEnabled: true } },
        camera: cameraConfig
      });

      // Clear default UI components
      this.view.ui.components = [];

      // Store references for other components
      MapComponent.map = map;
      MapComponent.view = this.view;

      console.log('Map initialized successfully with config:', config.title);
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }
}
