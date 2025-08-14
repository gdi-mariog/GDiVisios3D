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

  camera?: CameraConfig;
  bookmarks?: BookmarkConfig[];
  layers: LayerConfig[];
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

export interface BookmarkConfig {
  name: string;
  viewpoint: {
    camera: CameraConfig;
  };
}

export interface LayerConfig {
  id: string;
  title: string;
  url?: string;
  type: string;
  visible: boolean;
  popupEnabled?: boolean;
  elevationInfo?: any;
  renderer?: any;
  layers?: LayerConfig[];
  sublayers?: any[];
  definitionExpression?: string;
  labelsVisible?: boolean;
  labelingInfo?: any[];
  featureReduction?: any;
  orderBy?: any[];
  outFields?: string[];
  popupTemplate?: PopupTemplateConfig;
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

export interface SymbolLayerConfig {
  type: string;
  material?: {
    color: string;
    colorMixMode: string;
  };
  size?: number;
  outline?: {
    color: string;
    size: number;
  };
}

export interface RendererConfig {
  type: string;
  symbol?: {
    type: string;
    symbolLayers: SymbolLayerConfig[];
  };
  uniqueValueInfos?: Array<{
    value: string;
    symbol: {
      type: string;
      symbolLayers: SymbolLayerConfig[];
    };
  }>;
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
