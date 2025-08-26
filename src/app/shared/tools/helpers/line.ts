import Polyline from '@arcgis/core/geometry/Polyline';
import Extent from '@arcgis/core/geometry/Extent';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import LineSymbol3D from '@arcgis/core/symbols/LineSymbol3D';
import { DistanceData } from './distance-data';
import { ArcGisPoint } from './arcgis-point';
import { ILiteEvent, LiteEvent } from '../../LiteEvent';

export class Line {
    private readonly onRemoveFromGraphicsLayer = new LiteEvent<Line>();

    private polyline!: Polyline;
    private graphic?: Graphic;
    private _locked = false; // When line is locked no more points can be added to it

    private _data: (ArcGisPoint | DistanceData)[] = [];
    private _dataReverse: (ArcGisPoint | DistanceData)[] = [];
    private _totalLength: DistanceData = new DistanceData(0, 0, 0);

    constructor(private graphicsLayer: GraphicsLayer, private symbol: LineSymbol3D) {
        this.initializePolyline();
    }

    addPoint(point: ArcGisPoint, addToGraphicsLayer: boolean): void {
        if (this._locked) {
            console.error('Line is locked, no more points can be added', this);
            return;
        }

        this.polyline.insertPoint(0, this.polyline.paths[0].length, point.MapPoint);

        if (addToGraphicsLayer)
            point.addToGraphicsLayer();

        this.addPointToData(point);
        this.redrawPolyline();
    }

    get isLocked(): boolean {
        return this._locked;
    }

    get TotalLength(): DistanceData {
        return this._totalLength;
    }
    get Data(): (ArcGisPoint | DistanceData)[] {
        return this._data;
    }
    get DataReverse(): (ArcGisPoint | DistanceData)[] {
        return this._dataReverse;
    }

    lock(): void {
        this._locked = true;
    }

    get RemovedFromGraphicsLayer(): ILiteEvent<Line> {
        return this.onRemoveFromGraphicsLayer.expose();
    }

    get Extent(): Extent | nullish {
        return this.polyline.extent;
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

        this.updateDataReverse();
    }

    addToGraphicsLayer(): void {
        // For some reason after adding point to polyline, theres 50% chance that hasZ is false
        this.polyline.hasZ = true;
        this.graphic = new Graphic({
            geometry: this.polyline,
            symbol: this.symbol
        });
        this.graphicsLayer.add(this.graphic);
    }

    private initializePolyline(): void {
        // TODO SpatialReference
        this.polyline = new Polyline({ spatialReference: { wkid: 102100 } });
        this.polyline.addPath([]);
    }

    private redrawPolyline(): void {
        if (!this.graphic) {
            console.error('No graphic to remove.', this);
            return;
        }

        // To force polyline redraw, we need to remove graphic from graphics layer then add new one
        this.graphicsLayer.remove(this.graphic);
        this.addToGraphicsLayer();
    }

    private addPointToData(point: ArcGisPoint): void {
        const numDataItems = this._data.length;

        if (numDataItems === 0) {
            this._data.push(point);
        } else {
            // Calculate distance from previous point to this one
            // Point should always be the last one in data, so calculate distance fromm last to new point and add it to data
            const distanceData = this.calculateDistanceDataForPoints(this._data[numDataItems - 1] as ArcGisPoint, point);
            // Push it to _data
            this._data.push(distanceData);
            // Also add it to line total length
            this.addDistanceDataToTotalLength(distanceData);
            // Then add point to data
            this._data.push(point);
        }
        this.updateDataReverse();
    }

    private calculateDistanceDataForPoints(a: ArcGisPoint, b: ArcGisPoint): DistanceData {
        const dist2d = DistanceData.calculate2dDistance(a.MapPoint, b.MapPoint);

        const dist3d = DistanceData.calculate3dDistance(a.MapPoint, b.MapPoint);

        const heightDiff = DistanceData.calculateHeightDiff(a.MapPoint, b.MapPoint);

        return new DistanceData(dist3d, dist2d, heightDiff);
    }

    private addDistanceDataToTotalLength(dData: DistanceData): void {
        this._totalLength.incrementDistance2d(dData.Distance2d);
        this._totalLength.incrementDistance3d(dData.Distance3d);
        this._totalLength.incrementHeightDiff(dData.HeightDiff);
    }

    private updateDataReverse(): void {
        this._dataReverse = this._data.slice(0).reverse();
    }
}
