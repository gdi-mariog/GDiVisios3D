// Configuration interfaces for the GDI Visios3D application
export interface AppConfig {
  title: string;
  subtitle: string;
  tenantLogoUri: string;
  gdiLogoUri: string;
  appVersion: string;

  modalFooterLeftDestination: string;
  modalFooterLeftText: string;
  modalFooterRightLogoUri: string;
  modalFooterRightDestination: string;

  helpModalContentUri: string;
  welcomeModalContentUri: string;
  aboutModalContentUri: string;
  releaseNotesModalContentUri: string;

  circleUri: string;
  lineUri: string;
  multipleUri: string;
  pointUri: string;
  polygonUri: string;

  showWelcomeModal: boolean;
  showBookmarksPanel: boolean;
  tocPanelActive: boolean;
  showSliceWidget: boolean;
  sliceConfig?: SliceWidgetConfig;
  showBuildingExplorerWidget: boolean;
  showLineOfSightWidget: boolean;
  showElevationProfileWidget: boolean;

  'theme-bg': string;
  'theme-text': string;

  urlPrefix: string[];
  proxyUrl: string;
  supportedLayerTypes: string;
  spatialWkid: string;
  basemap: string;
  layerListGoToFullExtentButtonsEnabled: boolean;

  initialDateTime: string;
  shadowsEnabled: boolean;
  waterReflection: boolean;
  ambientOcclusionEnabled: boolean;
  viewLonLatElevation: number[];
  viewHeadingTiltFOV: number[];

  initialCircleRadius: number;
  minCircleRadius: number;
  maxCircleRadius: number;
  circleRadiusUnit: string;

  viewQualityProfile: string;
  atmosphereEnabled: boolean;
  atmosphereQuality: string;
  starsEnabled: boolean;

  viewHighlightColor: string;
  viewHighlightHaloOpacity: string;
  viewHighlightFillOpacity: string;

  popupPosition: string;

  selectToolEnabled: boolean;
  selectToolOutFields: string[];

  bookmarks?: BookmarkConfig[];

  selectToolAnalysisOperations: string[];

  selectToolAnalysisOperationalLabels: string[];

  drawToolEnabled: boolean;

  measureToolEnabled: boolean;
  measureToolOutFields: [];

  solidEdge: EdgeConfig;
  sketchEdge: EdgeConfig;

  measureToolPointSymbol: {
    symbolLayers: SymbolLayerConfig[];
  };
  measureToolLineSymbol: {
    symbolLayers: SymbolLayerConfig[];
  };

  selectToolPolygonSymbol: SymbolConfig;
  selectToolCircleSymbol: SymbolConfig;

  geometryServiceUrl: string;
  projectionSpatialReferenceWkid: number;
  elevationLayerUrls: string[];

  layers: LayerConfig[];

  camera?: CameraConfig;
}

export interface BookmarkConfig {
  name: string;
  viewLonLatElevation: number[];
  viewHeadingTiltFOV: number[];
  selected: boolean;
}

export interface EdgeConfig {
  type: string;
  color: number[];
  size: number;
  extensionLength?: number;
}

export interface MaterialConfig {
  color: number[];
}

export interface ResourceConfig {
  primitive: string;
}

export interface OutlineConfig {
  color: number[];
  size?: number;
  width?: number;
}

export interface FontConfig {
  family: string;
}

export interface SymbolConfig {
    color: number[];
    style: string;
    outline: OutlineConfig;
}

export interface SymbolLayerConfig {
  type: string;
  size: number;
  material: MaterialConfig;
  resource?: ResourceConfig;
  outline?: OutlineConfig;
  anchor?:string;
  font?:FontConfig;
}

export interface CameraConfig {
  position: {
    x: number;
    y: number;
    z: number;
    spatialReference: { wkid: number };
  };
  heading: number;
  tilt: number;
}

export interface LabelFormatConfig {
  digitSeparator: boolean;
  places: number;
}

export interface LabelConfig {
  label: string;
  format?: LabelFormatConfig;
}

export interface SublayerConfig {
  id: string;
  visible: boolean;
  popupEnabled: boolean;
}

export interface PointConfig {
  min: number;
  max: number;
  init: number;
}


export interface LayerConfig {
  id?: string;

  title: string;
  opacity: number;
  visible: boolean;
  listMode: string;

  type?: string;
  url?: string;
  isTileLayer?: boolean;
  legendEnabled?: boolean;
  visibilityMode?: string;

  layers?: LayerConfig[];
  renderer?: RendererConfig;
  outFields?: string[];

  popupDisplayFields?: Map<string, LabelConfig>;
  sublayers?: SublayerConfig[];

  defaultEdge?: string;
  availableEdges?: string[];
  castShadows?: boolean;

  symbolLayers?: {
    edges: EdgeConfig;
  }

  isPointCloudLayer?: boolean;
  pointSizes?: PointConfig;
  pointDensity?: PointConfig;



  // popupEnabled?: boolean;
  // elevationInfo?: any;
  
  // definitionExpression?: string;
  // labelsVisible?: boolean;
  // labelingInfo?: any[];
  // featureReduction?: any;
  // orderBy?: any[];

  // popupTemplate?: PopupTemplateConfig;
}

export interface PopupTemplateConfig {
  title: string;
  content: string | PopupContentConfig[];
  fieldInfos?: FieldInfoConfig[];
}

export interface PopupContentConfig {
  type: string;
  fieldInfos?: FieldInfoConfig[];
}

export interface FieldInfoConfig {
  fieldName: string;
  label: string;
  visible: boolean;
  format?: {
    places: number;
    digitSeparator: boolean;
  };
}

export interface RendererSymbolLayerConfig {
  type: string;
  waveDirection: number;
  color: string;
  waveStrength: string;
  waterbodySize: string;
}

export interface RendererSymbolConfig {
  type: string;
  symbolLayers?: RendererSymbolLayerConfig[];
  name?: string;
  styleName?: string;
}

export interface VisualVariableConfig {
  type: string;
  valueUnit: string;
  axis: string;
  field: string;
}

export interface UniqueValueInfoConfig {
  value: string;
  symbol: RendererSymbolConfig;
}

export interface RendererConfig {
  type: string;
  symbol?: RendererSymbolConfig;
  field?: string;
  defaultSymbol?: RendererSymbolConfig;
  visualVariables?: VisualVariableConfig[];
  uniqueValueInfos?: UniqueValueInfoConfig[];
}

// Slice widget configuration interface
export interface SliceWidgetConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tiltEnabled: boolean;
  excludeGroundSurface: boolean;
  defaultShape: 'plane' | 'sphere' | 'box' | 'cylinder';
  showShapeButtons: boolean;
  showTiltControls: boolean;
  showGroundExclusionToggle: boolean;
}

// Add slice config to main interface (extending existing properties)
export interface SliceConfig extends SliceWidgetConfig {
  // Additional slice-specific properties can be added here
}
