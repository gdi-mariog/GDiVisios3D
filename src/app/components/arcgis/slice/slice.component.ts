import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import SceneView from '@arcgis/core/views/SceneView';
import { ConfigService } from '../../../core/services/config.service';
import { SliceWidgetConfig } from '../../../core/interfaces/config.interface';

// Import map components
import '@arcgis/map-components/dist/components/arcgis-slice';

export interface SliceConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  analysisLayer?: string;
  shape?: 'plane' | 'sphere' | 'box' | 'cylinder';
  tiltEnabled?: boolean;
  excludeGroundSurface?: boolean;
}

@Component({
  selector: 'app-slice',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './slice.component.html',
  styleUrl: './slice.component.scss'
})
export class SliceComponent implements OnInit, OnDestroy, OnChanges {
  @Input() view!: SceneView;
  @Input() config: any = null;
  @Input() enabled: boolean = true;
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';

  sliceElement: any = null;
  isVisible: boolean = false;
  isSliceActive: boolean = false;
  sliceConfig: SliceConfig = {
    enabled: true,
    position: 'top-right',
    shape: 'plane',
    tiltEnabled: true,
    excludeGroundSurface: false
  };

  private destroy$ = new Subject<void>();

  constructor(private configService: ConfigService) {}

  ngOnInit() {
    this.loadConfigurationFromService();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['view'] && this.view) {
      this.initializeSliceComponent();
    }
    if (changes['enabled']) {
      this.updateVisibility();
    }
  }

  ngOnDestroy() {
    this.destroyComponent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConfigurationFromService() {
    // If config is passed as input, use it directly
    if (this.config) {
      this.sliceConfig = {
        enabled: this.config.enabled !== undefined ? this.config.enabled : true,
        position: this.config.position || this.position,
        shape: this.config.defaultShape || 'plane',
        tiltEnabled: this.config.tiltEnabled !== undefined ? this.config.tiltEnabled : true,
        excludeGroundSurface: this.config.excludeGroundSurface !== undefined ? this.config.excludeGroundSurface : false
      };

      this.updateVisibility();
      console.log('Slice component configuration loaded from input:', this.sliceConfig);
      return;
    }

    // Otherwise load from config service
    this.configService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      if (config) {
        // Load slice widget configuration from config file
        const sliceConfig = config.sliceConfig as SliceWidgetConfig | undefined;
        this.sliceConfig = {
          enabled: config.showSliceWidget || false,
          position: sliceConfig?.position || this.position,
          shape: sliceConfig?.defaultShape || 'plane',
          tiltEnabled: sliceConfig?.tiltEnabled !== undefined ? sliceConfig.tiltEnabled : true,
          excludeGroundSurface: sliceConfig?.excludeGroundSurface !== undefined ? sliceConfig.excludeGroundSurface : false
        };

        this.updateVisibility();

        console.log('Slice component configuration loaded from service:', this.sliceConfig);
      }
    });
  }

  private initializeSliceComponent() {
    if (!this.view) {
      console.warn('SceneView not available for Slice component');
      return;
    }

    try {
      console.log('Slice component initialized successfully with view');
    } catch (error) {
      console.error('Failed to initialize Slice component:', error);
    }
  }

  private updateVisibility() {
    this.isVisible = this.enabled && this.sliceConfig.enabled;
  }

  onSliceReady(event: any) {
    console.log('ArcGIS Slice component ready:', event);
    this.sliceElement = event.target;
  }

  toggleSlice() {
    this.isSliceActive = !this.isSliceActive;

    if (this.isSliceActive) {
      console.log('Slice tool activated');
    } else {
      console.log('Slice tool deactivated');
      this.clearSlice();
    }
  }

  toggleTilt(event: Event) {
    const target = event.target as HTMLInputElement;
    this.sliceConfig.tiltEnabled = target.checked;
    console.log('Tilt enabled:', this.sliceConfig.tiltEnabled);
  }

  toggleExcludeGround(event: Event) {
    const target = event.target as HTMLInputElement;
    this.sliceConfig.excludeGroundSurface = target.checked;
    console.log('Exclude ground surface:', this.sliceConfig.excludeGroundSurface);
  }

  changeShape(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sliceConfig.shape = target.value as 'plane' | 'sphere' | 'box';
    console.log('Shape changed to:', this.sliceConfig.shape);
  }

  clearSlice() {
    if (this.sliceElement && this.sliceElement.clear) {
      this.sliceElement.clear();
    }
    console.log('Slice cleared');
  }

  private destroyComponent() {
    if (this.sliceElement) {
      this.sliceElement = null;
      this.isSliceActive = false;
    }
  }

  // Public methods for external control
  public enable() {
    this.enabled = true;
    this.updateVisibility();
  }

  public disable() {
    this.enabled = false;
    this.updateVisibility();
    if (this.isSliceActive) {
      this.toggleSlice();
    }
  }

  public isEnabled(): boolean {
    return this.enabled && this.isVisible;
  }

  public getSliceElement(): any {
    return this.sliceElement;
  }
}
