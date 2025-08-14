import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { AppConfig, LayerConfig } from '../../core/interfaces/config.interface';

@Component({
  selector: 'app-config-demo',
  imports: [CommonModule],
  template: `
    <div class="config-demo">
      <h2>Configuration Demo</h2>

      @if (config) {
        <div class="config-section">
          <h3>Application Info</h3>
          <p><strong>Title:</strong> {{ config.title }}</p>
          <p><strong>Version:</strong> {{ config.appVersion }}</p>
          <p><strong>Basemap:</strong> {{ config.basemap }}</p>
        </div>

        <div class="config-section">
          <h3>Widget Configuration</h3>
          <ul>
            <li>Slice Widget: {{ config.showSliceWidget ? 'Enabled' : 'Disabled' }}</li>
            <li>Building Explorer: {{ config.showBuildingExplorerWidget ? 'Enabled' : 'Disabled' }}</li>
            <li>Line of Sight: {{ config.showLineOfSightWidget ? 'Enabled' : 'Disabled' }}</li>
            <li>Elevation Profile: {{ config.showElevationProfileWidget ? 'Enabled' : 'Disabled' }}</li>
          </ul>
        </div>

        <div class="config-section">
          <h3>Layers ({{ layers.length }})</h3>
          @if (layers.length > 0) {
            <ul class="layers-list">
              @for (layer of layers; track layer.id) {
                <li [class.visible]="layer.visible">
                  <strong>{{ layer.title }}</strong> ({{ layer.type }})
                  @if (layer.url) {
                    <br><small>{{ layer.url }}</small>
                  }
                </li>
              }
            </ul>
          }
        </div>

        <div class="config-section">
          <h3>Camera Configuration</h3>
          @if (config.camera) {
            <p><strong>Position:</strong>
              X: {{ config.camera.position.x }},
              Y: {{ config.camera.position.y }},
              Z: {{ config.camera.position.z }}
            </p>
            <p><strong>Heading:</strong> {{ config.camera.heading }}°</p>
            <p><strong>Tilt:</strong> {{ config.camera.tilt }}°</p>
          } @else {
            <p>No camera configuration found</p>
          }
        </div>
      } @else {
        <div class="loading">
          <p>Loading configuration...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .config-demo {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .config-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .config-section h3 {
      margin-top: 0;
      color: #333;
      border-bottom: 2px solid #007acc;
      padding-bottom: 5px;
    }

    .layers-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .layers-list li {
      margin-bottom: 10px;
      padding: 8px;
      background-color: white;
      border-radius: 4px;
    }

    .layers-list li.visible {
      border-left: 4px solid #28a745;
    }

    .layers-list li:not(.visible) {
      border-left: 4px solid #dc3545;
      opacity: 0.7;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    ul {
      list-style-type: none;
      padding-left: 0;
    }

    ul li {
      padding: 5px 0;
    }

    small {
      color: #666;
      word-break: break-all;
    }
  `]
})
export class ConfigDemoComponent implements OnInit, OnDestroy {
  config: AppConfig | null = null;
  layers: LayerConfig[] = [];
  private destroy$ = new Subject<void>();

  constructor(private configService: ConfigService) {}

  ngOnInit() {
    // Subscribe to configuration changes
    this.configService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.config = config;
      console.log('Config updated in demo component:', config);
    });

    // Subscribe to layers
    this.configService.getLayers().pipe(
      takeUntil(this.destroy$)
    ).subscribe(layers => {
      this.layers = layers;
    });

    // Example of getting a specific configuration value
    const showWelcome = this.configService.getValue<boolean>('showWelcomeModal');
    console.log('Show welcome modal:', showWelcome);

    // Example of getting widget configuration
    this.configService.getWidgetConfig().pipe(
      takeUntil(this.destroy$)
    ).subscribe(widgetConfig => {
      console.log('Widget configuration:', widgetConfig);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
