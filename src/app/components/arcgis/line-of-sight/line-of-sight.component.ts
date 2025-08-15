import { Component, Input, OnInit, OnDestroy, OnChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@arcgis/map-components/dist/components/arcgis-line-of-sight';

@Component({
  selector: 'app-line-of-sight',
  template: `
    <arcgis-line-of-sight
      [view]="view"
      [config]="config"
      class="line-of-sight-widget-overlay">
    </arcgis-line-of-sight>
  `,
  styleUrls: ['./line-of-sight.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LineOfSightComponent implements OnInit, OnDestroy, OnChanges {
  @Input() view: any;
  @Input() config: any;

  ngOnInit() {}
  ngOnDestroy() {}
  ngOnChanges() {}
}
