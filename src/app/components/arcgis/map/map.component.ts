import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';

import { SliceComponent } from '../slice/slice.component';
import { LineOfSightComponent } from '../line-of-sight/line-of-sight.component';
import { ConfigService } from '../../../core/services/config.service';
import { AppConfig } from '../../../core';
import { ArcGisService } from '../../../core/services/arcgis.service';
import { ViewService } from '../../../core/services/view.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, SliceComponent, LineOfSightComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('viewDiv', { static: true }) viewDiv!: ElementRef;
  //private el = inject(ElementRef<HTMLElement>);

  public mapView: MapView | null = null;
  public sceneView: SceneView | null = null;
  public appConfig: AppConfig | null = null;

  // Widget visibility flags from config
  showSliceWidget: boolean = false;
  sliceConfig: any = null;
  showLineOfSightWidget: boolean = false;
  lineOfSightConfig: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private configService: ConfigService,
    private arcgisService: ArcGisService,
    private viewService: ViewService
  ) {}

  async ngOnInit() {
    // Wait for config to load before initializing map
    this.configService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(async config => {
      if (config && !this.sceneView) {
        this.appConfig = config;

        const container = this.viewDiv.nativeElement;
        //this.mapView = await this.arcgisService.initMapView(container, config);
        this.sceneView = await this.arcgisService.initSceneView(container, config);

        // if (config.showSliceWidget) this.viewService.addSliceWidget(); // Deprecated
        if (config.showSliceWidget && this.sceneView) {
          this.showSliceWidget = true;
          this.sliceConfig = config.sliceConfig || {};
        } else {
          this.showSliceWidget = false;
        }
        if (config.showLineOfSightWidget && this.sceneView) {
          this.showLineOfSightWidget = true;
          this.lineOfSightConfig = (config as any).lineOfSightConfig || {};
        } else {
          this.showLineOfSightWidget = false;
        }
        if (config.showBuildingExplorerWidget) this.viewService.addBuildingExplorerWidget();
  // if (config.showLineOfSightWidget) this.viewService.addLineOfSightWidget(); // Deprecated
        if (config.showElevationProfileWidget) this.viewService.addElevationProfileWidget();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.sceneView) {
      this.sceneView.destroy();
    }
  }
  
}