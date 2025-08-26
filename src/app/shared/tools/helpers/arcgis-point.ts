import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer';
import { ILiteEvent, LiteEvent } from '../../LiteEvent';
import { ArcGisGeometryService } from '../../../core/services/arcgis-geometry.service';

export class ArcGisPoint {

    private readonly onRemoveFromGraphicsLayer = new LiteEvent<ArcGisPoint>();

    private _mapPoint: Point;
    private _projectedMapPoint!: Promise<Point | null>;
    private _label: string = '';
    private _props: Map<string, string> = new Map<string, string>();
    //private _propsArray: Array<Array<string>>;
    private _objectGraphic: Graphic | undefined = undefined;
    private _propsToShow: string[] = [];

    private graphicsLayer: GraphicsLayer;
    private symbol: PointSymbol3D | null = null;

    private graphic: Graphic | null = null;

    constructor(private geoService: ArcGisGeometryService, graphicsLayer: GraphicsLayer, mapPoint: Point,
        symbol?: PointSymbol3D, label?: string, objectGraphic?: Graphic, propsToShow?: string[]) {

        this.graphicsLayer = graphicsLayer;
        this._mapPoint = mapPoint;
        this._objectGraphic = objectGraphic;

        if (label && symbol) {
            this._label = label;
            // We got label, create unique symbol which will hold label text, use sent symbol as template
            this.createSymbolWithLabel(symbol);
        } else if (symbol) {
            this.symbol = symbol;
        }

        if (propsToShow) {
            this._propsToShow = propsToShow;
            this.initializeProperties(propsToShow, objectGraphic);
        }

        if (geoService.Enabled) {
            this._projectedMapPoint = this.geoService.projectPoint(this._mapPoint);
        }
    }

    // Subscribeable event
    get RemovedFromGraphicsLayer(): ILiteEvent<ArcGisPoint> {
        return this.onRemoveFromGraphicsLayer.expose();
    }

    get Props(): Map<string, string> {
        return this._props;
    }

    get PropsArray(): Array<Array<string>> {
        return Array.from(this._props);
    }

    get X(): number {
        return this._mapPoint.x;
    }

    get Y(): number {
        return this._mapPoint.y;
    }

    get Z(): number | undefined {
        return this._mapPoint.z;
    }

    get MapPoint(): Point {
        return this._mapPoint;
    }

    get ProjectedMapPoint(): Promise<Point | null> {
        return this._projectedMapPoint
            .catch(err => {
                console.error(err); return null;
            });
    }

    get Label(): string {
        return this._label;
    }

    get Longitude(): number | nullish {
        return this._mapPoint.longitude;
    }

    get Latitude(): number | nullish {
        return this._mapPoint.latitude;
    }

    set ObjectGraphic(objGraphic: Graphic) {
        console.log("yolo2");
        if (this._propsToShow)
            this.initializeProperties(this._propsToShow, objGraphic);

    }

    addToGraphicsLayer(): void {
        if (this.symbol == null) {
            console.error('Point without symbol cant be added to graphics layer');
            return;
        }

        // Create new graphic if point doesn't have one already
        if (this.graphic == null) {
            this.graphic = new Graphic({
                geometry: this._mapPoint,
                symbol: this.symbol
            });
        }

        this.graphicsLayer.add(this.graphic);
    }

    removeFromGraphicsLayer(): void {
        if (this.graphic) {
            if (this.graphic.layer instanceof GraphicsLayer) {
                this.graphic.layer.remove(this.graphic);
                this.onRemoveFromGraphicsLayer.trigger(this);
            } else {
                console.error("Can't remove graphic from graphics layer if graphic is not added to layer", this);
            }
        } else
            console.error('No graphic to remove.', this);
    }

    private createSymbolWithLabel(symbolTemplate: PointSymbol3D): void {
        this.symbol = symbolTemplate.clone();
        // Symbol should have text layer to which we'll add label text
        const symbolTextLayer: TextSymbol3DLayer = this.symbol.symbolLayers.find(sLyr => sLyr.type === 'text') as TextSymbol3DLayer;
        if (symbolTextLayer) {
            symbolTextLayer.text = this._label;
        } else {
            console.error('Label cant be added to symbol without textLayer');
        }
    }

    private initializeProperties(propsToShow: string[], objectGraphic: Graphic | undefined): void {
        console.log("yolo");
        if (objectGraphic === undefined) {
            console.error('objectGraphic is null, cant initialize properties');
            return;
        }

        const attributes = objectGraphic.attributes;
        if (attributes == null) {
            console.error('objectGraphic has no attributes, cant initialize properties');
            return;
        }
        // Show all if *
        if (propsToShow[0] === "*") {
            for (var key in attributes) {
                this._props.set(key, attributes[key]);
            }
        } else {
            // OBJECTID is key
            propsToShow.forEach(key => {
                if (attributes[key]) {
                    this._props.set(key, attributes[key]);
                }
            });
        }
    }
}
