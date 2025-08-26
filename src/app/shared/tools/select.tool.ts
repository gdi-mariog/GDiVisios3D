import { Injectable } from '@angular/core';

import Graphic from '@arcgis/core/Graphic';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Point from '@arcgis/core/geometry/Point';
import SceneView from '@arcgis/core/views/SceneView';

import { ArcGisPolygon } from './helpers/arcgis-polygon';
import { ArcGisCircle } from './helpers/arcgis-circle';
import { Tool } from './tool';
import { ToolMode } from './helpers/tool-mode';
import { AnalysisOperation } from './helpers/analysis-operation';
import { ArcGisPoint } from './helpers/arcgis-point';
import { ArcGisService } from '../../core/services/arcgis.service';
import { AppConfig, ConfigService } from '../../core';
import { ViewService } from '../../core/services/view.service';
import { ArcGisGeometryService } from '../../core/services/arcgis-geometry.service';
import { Symbols } from './helpers/symbols';
import Layer from '@arcgis/core/layers/Layer';

class OutFieldsWLabel {
    private fields: string[];
    private label: string;

    constructor(fields: string[], label: string) {
        this.fields = fields;
        this.label = label;
    }

    public addField(field: string): void {
        this.fields.push(field);
    }

    get Fields(): string[] {
        return this.fields;
    }

    get Label(): string {
        return this.label;
    }
}

class HighlightedGraphic {
    private graphic: Graphic;
    highlight: any;
    private id: number;
    private data: Map<string, string>; // Label - Value
    private dataArray: string[][];
    private layerView: any;

    constructor(id: number, graphic: Graphic, highlight: Object, data: Map<string, string>, layerView: any) {
        this.id = id;
        this.graphic = graphic;
        this.highlight = highlight;
        this.data = data;
        this.dataArray = Array.from(data);
        this.layerView = layerView;
    }

    get Graphic(): Graphic {
        return this.graphic;
    }

    get Id(): number {
        return this.id;
    }

    get Highlight(): any {
        return this.highlight;
    }

    get Data(): Map<string, string> {
        return this.data;
    }

    get DataArray(): string[][] {
        return this.dataArray;
    }

    get LayerView(): any {
        return this.layerView;
    }
}

@Injectable()
export class SelectTool extends Tool {

    private appConfig: AppConfig;

    // Tool output
    private _highlightedGraphics: HighlightedGraphic[] = [];

    // Analysis
    private _enabledAnalysisOperations: AnalysisOperation[] = []; // CFG
    private _activeAnalysisOperation: AnalysisOperation | null = null;
    private _operationalLabels: string[];
    private _activeOperationalLabel: string = '';
    private _analysisResult: number = 0;

    // Visuals
    private polygonSymbol: SimpleFillSymbol; // CFG
    private pointSymbol: PointSymbol3D; // CFG
    private circleSymbol: SimpleFillSymbol;
    private highlightFillOpacity: number; // CFG
    private higlightHaloOpacity: number; //CFG

    // Polygon used for selection
    private selectionPolygon: ArcGisPolygon | null = null;

    // Circle used for selection
    private selectionCircle: ArcGisCircle | null = null;
    circleRadius: Number;

    // OutFields
    private outFieldsWLabels: OutFieldsWLabel[] = [];
    private outFields: string[] = []; // Microoptimization, so we don't have to remap outFieldsWLabels all the time when used in queries

    constructor(
        private arcgisService: ArcGisService,
        private geoService: ArcGisGeometryService,
        private viewService: ViewService,
        private configService: ConfigService) {

        super('Select', [ToolMode.Multiple, ToolMode.Polygon, ToolMode.Circle], arcgisService);

        this.appConfig = this.configService.getConfig()!;

        // Pull symbols from cfg
        this.polygonSymbol = this.getSelectToolPolygonSymbol();
        this.pointSymbol = this.getSelectToolPointSymbol();
        this.circleSymbol = this.getSelectToolCircleSymbol();
        // Pull highlight opacity from cfg (highlight color is pulled in viewService when initializing view)
        this.highlightFillOpacity = this.configService.ViewHighlightFillOpacity;
        this.higlightHaloOpacity = this.configService.ViewHighlightHaloOpacity;

        // Set enabled operations from cfg
        this.configService.SelectToolAnalysisOperations.forEach(operationStr => this._enabledAnalysisOperations.push(operationStr as AnalysisOperation));
        // Set active operation to the first one that's enabled
        this.ActiveAnalysisOperation = this.EnabledAnalysisOperations[0];

        // Fill outFieldsWLabels and outFields
        this.buildOutFields();

        this._operationalLabels = this.configService.SelectToolAnalysisOperationalLabels;
        this.ActiveOperationalLabel = this.OperationalLabels[0];

        this.circleRadius = this.configService.InitialCircleRadius;
    }

    // Group fields by label
    buildOutFields(): void {
        let cfgOutFields = this.configService.SelectToolOutFields;

        // Microoptimization
        this.outFields = cfgOutFields.map(fieldLabelPair => fieldLabelPair[0]);

        // Get labels and filter unique
        let labels = cfgOutFields.map(fieldLabelPair => {
            return fieldLabelPair[1] ? fieldLabelPair[1] : fieldLabelPair[0]; // No label was set so we're using field as label
        }).filter(function (item, pos, self) {
            return self.indexOf(item) == pos;
        });

        this.outFieldsWLabels = [];
        labels.forEach(label => {
            let outFieldsWithLabel = new OutFieldsWLabel([], label);

            cfgOutFields.forEach(fieldLabelPair => {
                if (fieldLabelPair[1] == label && fieldLabelPair[1] != null) {
                    outFieldsWithLabel.addField(fieldLabelPair[0]);
                } else if (fieldLabelPair[0] == label) { // No label was set so we're using field as label
                    outFieldsWithLabel.addField(fieldLabelPair[0]);
                }
            });

            this.outFieldsWLabels.push(outFieldsWithLabel);
        });
    }

    onViewLeftClick(clickEvent: __esri.ViewClickEvent): void {

        // We don't want to do anything when tool's graphics layer is not visible
        if (!this.graphicsLayer.visible) {
            return;
        }

        // When we're in multiple select mode, we want 
        if (this.CurActiveMode === ToolMode.Multiple) {
            this.hitTestForGraphic(clickEvent);
        } else if (this.CurActiveMode === ToolMode.Polygon) {
            this.polygonAddPoint(clickEvent.mapPoint);

        } else if (this.CurActiveMode === ToolMode.Circle) {
            if (this.selectionCircle != null) {
                return;
            }
            this.circleAddPoint(clickEvent.mapPoint);

            this.arcgisService.map!.layers.forEach(layer => {
                if (layer.visible) {
                    if ((layer as any).layers) {
                        // HACK: as any
                        (layer as any).layers.forEach((item: any) => {
                            this.queryLayerForCircleGraphic(item);
                        });
                    } else {
                        this.queryLayerForCircleGraphic(layer);
                    }
                }
            });
        }
    }

    onViewLeftDoubleClick(clickEvent: __esri.ViewDoubleClickEvent): void {
        if (this.selectionPolygon && this.CurActiveMode === ToolMode.Polygon && !this.selectionPolygon.isLocked) {
            this.polygonAddPoint(clickEvent.mapPoint);
            this.selectionPolygon.lock();

            this.arcgisService.map?.layers.forEach(layer => {
                if (layer.visible) {
                    if ((layer as any).layers) {
                        // HACK: as any
                        (layer as any).layers.forEach((item: any) => {
                            this.queryLayerForPolygonGraphic(item);
                        });
                    } else {
                        this.queryLayerForPolygonGraphic(layer);
                    }
                }
            });
        }
    }

    private queryLayer(layer: any, query: any): void {

        if (layer.type === 'scene' && layer.visible === true) {
            layer.queryFeatures(query).then((response: { features: any[]; }) => {

                if (response.features.length != 0) {

                    response.features.forEach(graphic => {

                        this.viewService.View.whenLayerView(graphic.layer).then(layerView => {

                            let graphicIdField = Object.keys(graphic.attributes)[0];
                            let graphicIdValue = graphic.attributes[graphicIdField];

                            let alreadyHighlighted = this.findIfAlreadyHighlighted(graphicIdValue);
                            if (alreadyHighlighted != null) {
                                this.removeHighlightedGraphic(alreadyHighlighted);
                                this.updateAnalysisResult();
                                return;
                            }

                            const responseData = graphic.attributes;

                            let data = new Map<string, string>();

                            this.outFieldsWLabels.forEach(outFieldsWLabel => {
                                outFieldsWLabel.Fields.forEach(field => {
                                    if (responseData[field] != null) {
                                        data.set(outFieldsWLabel.Label, responseData[field]);
                                        return;
                                    }
                                });
                            });

                            let highlightedGraphic = new HighlightedGraphic(graphicIdValue, graphic, (layerView as any).highlight(graphic), data, layerView);
                            this._highlightedGraphics.push(highlightedGraphic);
                            this.updateAnalysisResult();

                        }, error => { console.error(error) });
                    });
                }
            }).catch((err: any) => { console.error(err) });
        }
    }

    private queryLayerForPolygonGraphic(layer: any): void {

        if (this.selectionPolygon && typeof layer.createQuery === 'function') {
            var query1 = layer.createQuery();
            query1.geometry = this.selectionPolygon.Polygon;
            query1.outFields = ['*'];

            this.queryLayer(layer, query1);
        }
    }

    private queryLayerForCircleGraphic(layer: any): void {

        if (this.selectionCircle &&typeof layer.createQuery === 'function') {
            var query1 = layer.createQuery();
            query1.geometry = this.selectionCircle.Circle;
            query1.outFields = ['*'];

            this.queryLayer(layer, query1);
        }
    }

    private polygonAddPoint(mapPoint: Point): void {
        let polygon: ArcGisPolygon;

        if (this.selectionPolygon == null) {
            polygon = new ArcGisPolygon(this.graphicsLayer, this.polygonSymbol);
            this.selectionPolygon = polygon;
        } else {
            polygon = this.selectionPolygon;
        }

        const pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol);
        polygon.RemovedFromGraphicsLayer.on(() => pt.removeFromGraphicsLayer());
        polygon.addPoint(pt, true);
    }

    private circleAddPoint(mapPoint: Point): void {

        let circle = new ArcGisCircle(this.graphicsLayer, this.circleSymbol, this.circleRadius);
        this.selectionCircle = circle;

        const pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol);
        circle.RemovedFromGraphicsLayer.on(() => pt.removeFromGraphicsLayer());
        circle.addCircle(pt);
    }

    // Checks if click was on a graphic
    hitTestForGraphic(clickEvent: __esri.ViewClickEvent): void {

        this.View.hitTest(clickEvent).then(response => {

            let objectGraphic: Graphic;
            let objectLayer: Layer | nullish;

            if (response.results[0]) {
                const result = response.results[0];
                if (result.type === "graphic") {
                    objectGraphic = result.graphic;
                    objectLayer = result.layer;
                }
                // else if (result.type === "media") {
                //     const element = result.element;
                // }
                // else if (result.type === "route") {
                //     const networkFeature = result.networkFeature;
                // }
                else {
                    return;
                }

                //let graphic = response.results[0].graphic;
                // We only want to highlight graphics in scene and feature layers
                // Can be done for Stream, CSV and Graphics layers too
                if (objectGraphic.layer && (objectGraphic.layer.type == "scene" || objectGraphic.layer.type == "feature")) {
                    this.highlightGraphic(objectGraphic);
                } else {
                    return;
                }
            }

        }).catch(err => {
            console.error(err);
            return;
        });
    }

    highlightGraphic(graphic: Graphic): void {

        if(!graphic || !graphic.layer) 
            return;

        this.View.whenLayerView(graphic.layer as Layer).then(layerView => {

            let graphicIdField = Object.keys(graphic.attributes)[0];
            let graphicIdValue = graphic.attributes[graphicIdField];

            if (graphicIdValue == null) {
                console.warn('Graphic cannot be highlighted because id is null.');
                return;
            }

            // Stream layer doesnt have queryFeatures method
            if (graphic.layer!.type === 'stream') {
                console.warn('Cannot get attributes from stream layer.');
                return;
            }

            let alreadyHighlighted = this.findIfAlreadyHighlighted(graphicIdValue);
            if (alreadyHighlighted != null) {
                this.removeHighlightedGraphic(alreadyHighlighted);
                this.updateAnalysisResult();
                return;
            }

            console.error(graphicIdValue);

            if (typeof (layerView as any).createQuery === 'function') {
                console.log((layerView as any).availableFields);
                var query1 = (layerView as any).createQuery();
                query1.objectIds = [graphicIdValue];
                query1.outFields = ['*'];


                (layerView as any).layer.queryFeatures(query1).then((response: { features: { attributes: any; }[]; }) => {

                    // We always click on 1 feature
                    const responseData = response.features[0].attributes;

                    let data = new Map<string, string>();

                    this.outFieldsWLabels.forEach(outFieldsWLabel => {
                        outFieldsWLabel.Fields.forEach(field => {
                            if (responseData[field] != null) {
                                data.set(outFieldsWLabel.Label, responseData[field]);
                                return;
                            }
                        });
                    });

                    let highlightedGraphic = new HighlightedGraphic(graphicIdValue, graphic, (layerView as any).highlight(graphic), data, layerView);
                    this._highlightedGraphics.push(highlightedGraphic);
                    this.updateAnalysisResult();
                });
            }
        }, error => { console.error(error) }).catch(err => {
            console.error(err);
        });
    }

    findIfAlreadyHighlighted(graphicId: number): HighlightedGraphic | null {

        for (let i = 0; i < this._highlightedGraphics.length; i++) {
            if (this._highlightedGraphics[i].Id == graphicId) {
                return this._highlightedGraphics[i];
            }
        }

        return null;
    }

    removeHighlightedGraphic(highlighted: HighlightedGraphic): void {
        highlighted.Highlight.remove();
        const indexToRemove = this._highlightedGraphics.indexOf(highlighted);
        this._highlightedGraphics.splice(indexToRemove, 1);
    }

    updateAnalysisResult(): void {
        
        if (this.ActiveAnalysisOperation == AnalysisOperation.Sum) {
            this._analysisResult = 0;
            for (let i = 0; i < this._highlightedGraphics.length; i++) {
                const hG = this._highlightedGraphics[i];
                const value = hG.Data.get(this._activeOperationalLabel);
                if (value) {
                    this._analysisResult += +value;
                }
            }
        } 
        else if (this.ActiveAnalysisOperation == AnalysisOperation.Avg) {
            this._analysisResult = 0;
            for (let i = 0; i < this._highlightedGraphics.length; i++) {
                const hG = this._highlightedGraphics[i];
                const value = hG.Data.get(this._activeOperationalLabel);
                if (value) {
                    this._analysisResult += +value;
                }
            }
            this._analysisResult = this._analysisResult / this._highlightedGraphics.length;
        } 
        else if (this.ActiveAnalysisOperation == AnalysisOperation.Min) {
            this._analysisResult = 0;
            const validGraphicsValues = this._highlightedGraphics
                .filter(x => x.Data.get(this._activeOperationalLabel) != null)
                .map(y => Number(y.Data.get(this._activeOperationalLabel)));

            this._analysisResult = Math.min(...validGraphicsValues);
        } 
        else if (this.ActiveAnalysisOperation == AnalysisOperation.Max) {
            this._analysisResult = 0;
            const validGraphicsValues = this._highlightedGraphics
                .filter(x => x.Data.get(this._activeOperationalLabel) != null)
                .map(y => Number(y.Data.get(this._activeOperationalLabel)));

            this._analysisResult = Math.max(...validGraphicsValues);
        }
    }

    // Shortcut for this.viewService.View
    get View(): SceneView {
        return this.viewService.View;
    }

    // Analysis getters/setters
    get EnabledAnalysisOperations(): AnalysisOperation[] {
        return this._enabledAnalysisOperations;
    }

    get ActiveAnalysisOperation(): AnalysisOperation | null {
        return this._activeAnalysisOperation;
    }

    set ActiveAnalysisOperation(operation: AnalysisOperation) {
        this._activeAnalysisOperation = operation;
    }

    get AnalysisResult(): number {
        return this._analysisResult;
    }
    get OperationalLabels(): string[] {
        return this._operationalLabels;
    }

    get ActiveOperationalLabel(): string {
        return this._activeOperationalLabel;
    }

    set ActiveOperationalLabel(lbl: string) {
        this._activeOperationalLabel = lbl;
    }

    // UI Bindings
    get HighlightedGraphics(): HighlightedGraphic[] {
        return this._highlightedGraphics;
    }

    get CurActiveMode(): ToolMode {
        return this._curActiveMode;
    }

    set CurActiveMode(toolMode: ToolMode) {
        const validToolMode = super.isValidToolMode(toolMode);
        if (validToolMode) {
            this._curActiveMode = toolMode;
        } else {
            throw new RangeError('Invalid tool mode!');
        }
    }

    override clear(): void {
        this._analysisResult = 0;
        this.selectionPolygon = null;
        this.selectionCircle = null;
        this.graphicsLayer.removeAll();
        this.removeAllHighlights();
    }

    removeAllHighlights(): void {
        this.graphicsLayer.removeAll();
        this._highlightedGraphics.forEach(gr => gr.Highlight.remove());
        this._highlightedGraphics = [];
    }

    // Override Hidden setter because we also want to change highlight opacity
    override set Hidden(value: boolean) {
        this.graphicsLayer.visible = !value;

        if (!this.graphicsLayer.visible) {
            this.viewService.View.highlightOptions.fillOpacity = 0;
            this.viewService.View.highlightOptions.haloOpacity = 0;
        } else {
            this.viewService.View.highlightOptions.fillOpacity = this.higlightHaloOpacity;
            this.viewService.View.highlightOptions.haloOpacity = this.higlightHaloOpacity;
        }
    }

    override get Hidden(): boolean {
        return !this.graphicsLayer.visible;
    }

    private getSelectToolPolygonSymbol(): SimpleFillSymbol {
        if (this.appConfig.selectToolPolygonSymbol != null) {
            let symbol = new SimpleFillSymbol({
                ...this.appConfig.selectToolPolygonSymbol
            });
            return symbol;
        } else {
            console.info("No select tool polygon symbol set in cfg, returning default value", Symbols.selectToolPolygon);
            return Symbols.selectToolPolygon;
        }
    }

    private getSelectToolPointSymbol(): PointSymbol3D {
        if (this.appConfig.selectToolPointSymbol != null) {
            let symbol = new PointSymbol3D({
                ...this.appConfig.selectToolPointSymbol
            });
            return symbol;
        } else {
            console.info("No select tool point symbol set in cfg, returning default value", Symbols.selectToolPoint);
            return Symbols.selectToolPoint;
        }
    }

    private getSelectToolCircleSymbol(): SimpleFillSymbol {
        if (this.appConfig.selectToolCircleSymbol != null) {
            let symbol = new SimpleFillSymbol({
                ...this.appConfig.selectToolCircleSymbol
            });
            return symbol;
        } else {
            console.info("No select tool circle symbol set in cfg, returning default value", Symbols.selectToolCircle);
            return Symbols.selectToolCircle;
        }
    }
}
