# Migration Guide: Integrate ArcGIS Maps SDK for JavaScript in Angular 20

## 1. Prerequisites

- Access to the [ArcGIS Maps SDK for JavaScript documentation](https://developers.arcgis.com/javascript/latest/).

## 2. Angular 20 instructions

- **Follow the instructions in `INSTRUCTIONS_ANGULAR20.md` for Angular best practices.**

## 3. Example: Add a Map Component (Recommended Folder Structure)

- Generate the map component in the recommended folder:

```sh
ng generate component components/arcgis/map
```

- In `src/app/components/arcgis/map/map.component.ts`:

```typescript
// filepath: src/app/components/arcgis/map/map.component.ts
import { OnInit, OnDestroy } from '@angular/core';
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";

export class MapComponent implements OnInit, OnDestroy {
  private view: __esri.SceneView | undefined;

  ngOnInit() {
    const map = new Map({
      basemap: "topo-vector"
    });

    this.view = new SceneView({
      container: "viewDiv",
      map,
      center: [15.9793, 45.7776], // Example: Zagreb
      zoom: 13
    });
  }

  ngOnDestroy() {
    this.view?.destroy();
  }
}
```

- In `src/app/components/arcgis/map/map.component.html`:

```html
<!-- filepath: src/app/components/arcgis/map/map.component.html -->
<div id="viewDiv" style="width:100%;height:100vh;"></div>
```

## 4. Implement Features from configuration file

- Review your configuration (e.g., `public/configuration/config-files/config_4_20_2.json`) for:
  - Layer definitions (FeatureLayer, SceneLayer, etc.)
  - Widgets (Slice, BuildingExplorer, LineOfSight, ElevationProfile, etc.)
  - Symbols, renderers, bookmarks, popups, etc.
- For each feature:
  - Use the [ArcGIS Maps SDK for JavaScript API Reference](https://developers.arcgis.com/javascript/latest/api-reference/) to find the modern equivalent.
  - Instantiate and configure layers/widgets in your Angular services or components.
  - Use dynamic imports for widgets and layers as needed.

## 5. Example: Add a FeatureLayer

```typescript
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
// ...inside ngOnInit after map creation...
const featureLayer = new FeatureLayer({
  url: "https://services1.arcgis.com/srGsjgmVH7sYUOi4/arcgis/rest/services/ZG3D_2D_2019/FeatureServer/1",
  outFields: ["*"],
  visible: true
});
map.add(featureLayer);
```

## 6. Add Widgets

- Import and add widgets (e.g., Slice, BuildingExplorer):

```typescript
import Slice from "@arcgis/core/widgets/Slice";
// ...after view is ready...
const sliceWidget = new Slice({
  view: this.view
});
this.view.ui.add(sliceWidget, "top-right");
```

## 7. Use Environment and Config Files

- Store configuration (layer URLs, settings) in JSON config file config_4_20_2.json, and load/read them via service defined in constructor:
constructor(private configService: ConfigService) {}

## 8. Test and Refactor

- Test each implemented feature.
- Refactor code to use Angular best practices (services, modules, observables).

## 9. Reference

- [ArcGIS Maps SDK for JavaScript Guide](https://developers.arcgis.com/javascript/latest/)
- [Angular Documentation](https://angular.io/docs)

---

**Tip:** Create one feature at a time, testing as you go. Use the new SDK’s ES module imports and avoid legacy Dojo/AMD patterns.
