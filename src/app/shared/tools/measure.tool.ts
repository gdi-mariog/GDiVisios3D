import { Injectable } from '@angular/core';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import LineSymbol3D from '@arcgis/core/symbols/LineSymbol3D';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';

import { Line } from './helpers/line';
import { ArcGisPoint } from './helpers/arcgis-point';
import { ToolMode } from './helpers/tool-mode';
import { Tool } from './tool';
import { ArcGisService } from '../../core/services/arcgis.service';
import { ViewService } from '../../core/services/view.service';
import { AppConfig, ConfigService } from '../../core';
import { ArcGisGeometryService } from '../../core/services/arcgis-geometry.service';
import { Symbols } from './helpers/symbols';
import Layer from '@arcgis/core/layers/Layer';

@Injectable()
export class MeasureTool extends Tool {

    private appConfig: AppConfig;

    private pointSymbol: PointSymbol3D;
    private lineSymbol: LineSymbol3D;

    private _pointModeOutput: ArcGisPoint[] = [];
    private _pointModeOutputReverse: ArcGisPoint[] = [];
    private _lineModeOutput: Line[] = [];

    private numPoints = 0; // Used for generating labels

    constructor(private arcgisService: ArcGisService,
        private geoService: ArcGisGeometryService,
        private viewService: ViewService,
        private configService: ConfigService) {
        super('Measure', [ToolMode.Point, ToolMode.Line], arcgisService);

        this.appConfig = this.configService.getConfig()!;
        this.pointSymbol = this.getMeasureToolPointSymbol();
        this.lineSymbol = this.getMeasureToolLineSymbol();
    }

    onViewLeftClick(clickEvent: __esri.ViewClickEvent): void {
        // We don't want to do anything when tool's graphics layer is not visible
        if (!this.graphicsLayer.visible) {
            return;
        }

        let mapPoint = clickEvent.mapPoint;

        let objectGraphic: Graphic;
        let objectLayer: Layer | nullish;

        this.viewService.View.hitTest(clickEvent, { exclude: [this.viewService.View.graphics] }).then(response => {

            if (response.results[0]) {
                mapPoint = response.results[0].mapPoint!;

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

                let objId = null;

                for (var prop in objectGraphic.attributes) {
                    objId = objectGraphic.attributes[prop];
                    break;
                }

                this.viewService.View.whenLayerView(objectLayer!).then(lyrView => {

                    let pt: ArcGisPoint;
                    if (this.CurActiveMode === ToolMode.Point) {
                        pt = this.pointModeAddPoint(mapPoint, objectGraphic);
                    } else if (this.CurActiveMode === ToolMode.Line) {
                        this.lineModeAddPoint(mapPoint);
                    }

                    if (typeof (lyrView as any).createQuery === 'function') {
                        console.log((lyrView as any).availableFields);
                        var query1 = (lyrView as any).createQuery();
                        query1.objectIds = [objId];
                        query1.outFields = ['*'];
                        query1.returnGeometry = false;

                        (lyrView as any).layer.queryFeatures(query1).then((response: { features: { attributes: any; }[]; }) => {

                            objectGraphic.attributes = response.features[0].attributes;
                            pt.ObjectGraphic = objectGraphic;

                        }).catch((err: any) => { console.error(err);})
                    };
                }).catch((err: any) => {
                    console.error(err);
                });

            } else {
                if (this.CurActiveMode === ToolMode.Point) {
                    this.pointModeAddPoint(mapPoint);
                } else if (this.CurActiveMode === ToolMode.Line) {
                    this.lineModeAddPoint(mapPoint);
                }
            }
        }).catch(err => {
            console.error(err);
        });
    }

    onViewLeftDoubleClick(clickEvent: __esri.ViewDoubleClickEvent): void {

        // We don't want to do anything when tool's graphics layer is not visible
        if (!this.graphicsLayer.visible) {
            return;
        }

        if (this.CurActiveMode === ToolMode.Line) {
            if (!this.LastLine.isLocked) {
                this.LastLine.lock();
            }
        }
    }

    override clear(): void {
        this.graphicsLayer.removeAll();
        this._lineModeOutput = [];
        this._pointModeOutput = [];
        this._pointModeOutputReverse = [];
        this.numPoints = 0;
    }

    get PointModeOutput(): ArcGisPoint[] {
        return this._pointModeOutput;
    }
    get PointModeOutputReverse(): ArcGisPoint[] {
        return this._pointModeOutputReverse;
    }
    get LineModeOutput(): Line[] {
        return this._lineModeOutput;
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

    override get Hidden(): boolean {
        return !this.graphicsLayer.visible;
    }

    override set Hidden(value: boolean) {
        this.graphicsLayer.visible = !value;
    }

    private pointModeAddPoint(mapPoint: Point, objectGraphic?: Graphic): ArcGisPoint {
        let pt: ArcGisPoint;

        if (objectGraphic) { // If we got objectGraphic, get props to show from config
            const propsToShow: string[] = this.getMeasureToolOutFields();
            pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol, this.getPointLabel(), objectGraphic, propsToShow);
        } else {
            pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol, this.getPointLabel());
        }

        // Add to output
        const output = this._pointModeOutput;
        output.push(pt);
        this.updatePointModeOutputReverse();
        // Add point to layer
        pt.addToGraphicsLayer();
        // When point is removed from graphics layer, we want to remove it from output too
        pt.RemovedFromGraphicsLayer.on((point?: ArcGisPoint) => {
            if (point) {
                this.removeFromOutput(point, output);
                this.updatePointModeOutputReverse();
            }
        });

        this.numPoints++;

        return pt;
    }

    private updatePointModeOutputReverse(): void {
        this._pointModeOutputReverse = this._pointModeOutput.slice(0).reverse();
    }

    private get LastLine(): Line {
        return this._lineModeOutput[this._lineModeOutput.length - 1];
    }

    private lineModeAddPoint(mapPoint: Point): void {
        let line;

        // If we don't have a line yet we need to start drawing new one
        if (!this.LastLine) {
            line = new Line(this.graphicsLayer, this.lineSymbol);

            line.RemovedFromGraphicsLayer.on((lne?: Line) => {
                if (lne) {
                    this.removeFromOutput(lne, this._lineModeOutput);
                }
            });

            this._lineModeOutput.push(line);
        } else { // We're gonna add point to the last line
            line = this.LastLine;
        }

        const pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol, this.getPointLabel());
        line.RemovedFromGraphicsLayer.on(() => pt.removeFromGraphicsLayer());
        line.addPoint(pt, true);
        this.numPoints++;
    }

    private getPointLabel(): string {
        // ASCII Magic
        const letter = String.fromCharCode(this.numPoints % 25 + 65);
        const suffixNo = Math.floor(this.numPoints / 25) === 0 ? '' : Math.floor(this.numPoints / 25);

        // Returns A-Z then A1-Z1 then A2-Z2, etc..
        return letter + suffixNo;
    }

    private removeFromOutput<T>(item: T, output: T[]): void {
        const index = output.indexOf(item);
        if (index !== -1) {
            output.splice(index, 1);
        }
    }

    private getMeasureToolPointSymbol(): PointSymbol3D {
        if (this.appConfig.measureToolPointSymbol != null) {
            let symbol = new PointSymbol3D({
                ...this.appConfig.measureToolPointSymbol
            });
            return symbol;
        } else {
            console.info("No measure tool point symbol set in cfg, returning default value", Symbols.measureToolPoint);
            return Symbols.measureToolPoint;
        }
    }

    private getMeasureToolLineSymbol(): LineSymbol3D {
        if (this.appConfig.measureToolLineSymbol != null) {
            let symbol = new LineSymbol3D({
                ...this.appConfig.measureToolLineSymbol
            });
            return symbol;
        } else {
            console.info("No measure tool line symbol set in cfg, returning default value", Symbols.measureToolLine);
            return Symbols.measureToolLine;
        }
    }

    private getMeasureToolOutFields(): string[] {
        return this.appConfig.measureToolOutFields ?? [];
    }
}
