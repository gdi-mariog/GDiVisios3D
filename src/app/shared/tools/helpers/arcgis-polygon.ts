
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { ArcGisPoint } from './arcgis-point';
import { ILiteEvent,LiteEvent } from '../../LiteEvent';

export class ArcGisPolygon {
    private readonly onRemoveFromGraphicsLayer = new LiteEvent<ArcGisPolygon>();

    private polygon!: Polygon;
    private graphic?: Graphic;
    private graphicsLayer: GraphicsLayer;
    private symbol: SimpleFillSymbol;
    private _locked = false;
    private firstPoint?: ArcGisPoint;

    constructor(graphicsLayer: GraphicsLayer, symbol: SimpleFillSymbol) {
        this.symbol = symbol;
        this.graphicsLayer = graphicsLayer;
        this.initializePolygon();
    }

    addPoint(point: ArcGisPoint, addToGraphicsLayer: boolean): void {
        if (this._locked) {
            console.error('Polygon is locked, no more points can be added', this);
            return;
        }

        if (this.polygon.rings[0].length === 0) 
            this.firstPoint = point;        

        this.polygon.insertPoint(0, this.polygon.rings[0].length, point.MapPoint);

        if (addToGraphicsLayer)
            point.addToGraphicsLayer();

        this.redrawPolygon();
    }

    get isLocked(): boolean {
        return this._locked;
    }

    get Polygon(): Polygon {
        return this.polygon;
    }

    lock(): void {
        this._locked = true;
    }

    get RemovedFromGraphicsLayer(): ILiteEvent<ArcGisPolygon> {
        return this.onRemoveFromGraphicsLayer.expose();
    }

    removeFromGraphicsLayer(): void {
        if (this.graphic) {
            if (this.graphic.layer instanceof GraphicsLayer) {
                this.graphic.layer.remove(this.graphic);
                this.onRemoveFromGraphicsLayer.trigger(this);
            }
            else {
                console.error("Can't remove graphic from graphics layer if graphic is not added to layer", this);
            }
        } 
        else {
            console.error('No graphic to remove.', this);
        }
    }

    addToGraphicsLayer(): void {

        this.polygon.hasZ = false;
        this.graphic = new Graphic({
            geometry: this.polygon,
            symbol: this.symbol
        });

        this.graphicsLayer.add(this.graphic);
    }

    private initializePolygon(): void {
        const ring: number[][] = [];
        this.polygon = new Polygon({ spatialReference: { wkid: 102100 } });
        this.polygon.addRing(ring);
    }

    private redrawPolygon(): void {
        if (!this.graphic) {
            console.error('No graphic to remove.', this);
            return;
        }

        this.copyFirstPointToLast();
        this.graphicsLayer.remove(this.graphic);
        this.addToGraphicsLayer();
        this.removeLastPointFromPolygon();
    }

    private copyFirstPointToLast(): void {
        if (!this.firstPoint) {
            console.error('No first point to copy.', this);
            return;
        }
        
        this.polygon.insertPoint(0, this.polygon.rings[0].length, this.firstPoint.MapPoint);
    }

    private removeLastPointFromPolygon(): void {
        this.polygon.removePoint(0, this.polygon.rings[0].length - 1);
    }

    //private clockwiseSort(input: any[], basic: number, center: any): any[] {

    //    const base = Math.atan2(input[basic][1], input[basic][0]);

    //    return input.sort((a, b) => {
    //        return Math.atan2(b[1] - center[1], b[0] - center[0]) - Math.atan2(a[1] - center[1], a[0] - center[0])
    //            + (Math.atan2(b[1] - center[1], b[0] - center[0]) > base ? - Math.PI * 2 : 0) + (Math.atan2(a[1] - center[1],
    //                a[0] - center[0]) > base ? Math.PI * 2 : 0);
    //    });
    //}

    private getCenter(arr: any[]): any[] {
        let minX: number = 0;
        let maxX: number = 0;
        let minY: number = 0;
        let maxY: number = 0;

        for (const item of arr) {
            minX = (item[0] < minX || minX == null) ? item[0] : minX;
            maxX = (item[0] > maxX || maxX == null) ? item[0] : maxX;
            minY = (item[1] < minY || minY == null) ? item[1] : minY;
            maxY = (item[1] > maxY || maxY == null) ? item[1] : maxY;
        }

        return [(minX + maxX) / 2, (minY + maxY) / 2];
    }
}