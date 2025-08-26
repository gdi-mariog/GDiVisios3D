import { Component, Input, OnInit, OnDestroy, OnChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@arcgis/map-components/dist/components/arcgis-home';

@Component({
  selector: 'app-home',
  template: `
    <arcgis-home
      [view]="view"
      class="home-widget-overlay"
      (click)="resetView()">
    </arcgis-home>
  `,
  styleUrls: ['./home.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() view: any;
  private initialCamera: any;

  ngOnInit() {
    if (this.view) {
      // Store the initial camera position
      this.initialCamera = this.view.camera.clone();
    }
  }
  ngOnDestroy() {}
  ngOnChanges() {}

  resetView() {
    if (this.view && this.initialCamera) {
      this.view.goTo(this.initialCamera);
    }
  }
}
