import { Injectable } from '@angular/core';
import Point from '@arcgis/core/geometry/Point';
import LineSymbol3D from '@arcgis/core/symbols/LineSymbol3D';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';

import { ArcGisPolygon } from './helpers/arcgis-polygon';
import { Line } from './helpers/line';
import { ArcGisPoint } from './helpers/arcgis-point';
import { ToolMode } from './helpers/tool-mode';
import { Symbols } from './helpers/symbols';
import { Tool } from './tool';
import { ArcGisGeometryService } from '../../core/services/arcgis-geometry.service';
import { AppConfig, ConfigService } from '../../core';
import { ArcGisService } from '../../core/services/arcgis.service';

@Injectable()
export class DrawTool extends Tool {

    private appConfig: AppConfig;
    private pointSymbol: PointSymbol3D;
    private lineSymbol: LineSymbol3D;
    private polygonSymbol: SimpleFillSymbol;

    private _lineModeOutput: Line[] = [];
    private _polygonModeOutput: ArcGisPolygon[] = [];

    constructor(private configService: ConfigService, private geoService: ArcGisGeometryService, private arcgisService: ArcGisService) {
        super('Draw', [ToolMode.Point, ToolMode.Line, ToolMode.Polygon], arcgisService);

        this.appConfig = this.configService.getConfig()!;

        this.pointSymbol = this.getDrawToolPointSymbol();
        this.lineSymbol = this.getDrawToolLineSymbol();
        this.polygonSymbol = this.getDrawToolPolygonSymbol();
    }

    onViewLeftClick(clickEvent: __esri.ViewClickEvent): void {

        // We don't want to do anything when tool's graphics layer is not visible
        if (!this.graphicsLayer.visible) {
            return;
        }

        const mapPoint = clickEvent.mapPoint;

        if (this.CurActiveMode === ToolMode.Point) {
            this.pointModeAddPoint(mapPoint);

        } else if (this.CurActiveMode === ToolMode.Line) {
            this.lineModeAddPoint(mapPoint);

        } else if (this.CurActiveMode === ToolMode.Polygon) {
            this.polygonModeAddPoint(mapPoint);
        }
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

        } else if (this.CurActiveMode === ToolMode.Polygon) {
            if (!this.LastPolygon.isLocked) {
                this.LastPolygon.lock();
            }
        }
    }

    override clear(): void {
        this.graphicsLayer.removeAll();
        this._lineModeOutput = [];
        this._polygonModeOutput = [];
    }

    get CurActiveMode(): ToolMode {
        return this._curActiveMode;
    }

    set CurActiveMode(toolMode: ToolMode) {
        const validToolMode = super.isValidToolMode(toolMode);

        if (validToolMode) {

            this._curActiveMode = toolMode;
            if (this._curActiveMode === ToolMode.Line) {

            }
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

    private get LastLine(): Line {
        return this._lineModeOutput[this._lineModeOutput.length - 1];
    }

    private get LastPolygon(): ArcGisPolygon {
        return this._polygonModeOutput[this._polygonModeOutput.length - 1];
    }

    private pointModeAddPoint(mapPoint: Point): void {

        let pt: ArcGisPoint;
        pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol);

        // Add point to layer
        pt.addToGraphicsLayer();
    }

    private lineModeAddPoint(mapPoint: Point): void {
        let line;

        // If we don't have a line yet we need to start drawing new one
        if (!this.LastLine) {
            line = new Line(this.graphicsLayer, this.lineSymbol);

            this._lineModeOutput.push(line);
        } else { // We're gonna add point to the last line
            line = this.LastLine;
        }

        const pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol);
        line.RemovedFromGraphicsLayer.on(() => pt.removeFromGraphicsLayer());
        line.addPoint(pt, true);
    }

    private polygonModeAddPoint(mapPoint: Point): void {
        let polygon;

        if (!this.LastPolygon) {
            polygon = new ArcGisPolygon(this.graphicsLayer, this.polygonSymbol);

            this._polygonModeOutput.push(polygon);
        } else {
            polygon = this.LastPolygon;
        }

        const pt = new ArcGisPoint(this.geoService, this.graphicsLayer, mapPoint, this.pointSymbol);
        polygon.RemovedFromGraphicsLayer.on(() => pt.removeFromGraphicsLayer());
        polygon.addPoint(pt, true);
    }

    private getDrawToolPointSymbol(): PointSymbol3D {
        if (this.appConfig.drawToolPointSymbol != null) {
            let symbol = new PointSymbol3D({
                ...this.appConfig.drawToolPointSymbol
            });
            return symbol;
        } else {
            console.info("No draw tool point symbol set in cfg, returning default value", Symbols.drawToolPoint);
            return Symbols.drawToolPoint;
        }
    }

    private getDrawToolLineSymbol(): LineSymbol3D {
        if (this.appConfig.drawToolLineSymbol != null) {
            let symbol = new LineSymbol3D({
                ...this.appConfig.drawToolLineSymbol
            });
            return symbol;
        } else {
            console.info("No draw tool line symbol set in cfg, returning default value", Symbols.drawToolLine);
            return Symbols.drawToolLine;
        }
    }

    private getDrawToolPolygonSymbol(): SimpleFillSymbol {
        if (this.appConfig.drawToolPolygonSymbol != null) {
            let symbol = new SimpleFillSymbol({
                ...this.appConfig.drawToolPolygonSymbol
            });
            return symbol;
        } else {
            console.info("No draw tool polygon symbol set in cfg, returning default value", Symbols.drawToolPolygon);
            return Symbols.drawToolPolygon;
        }
    }
}
