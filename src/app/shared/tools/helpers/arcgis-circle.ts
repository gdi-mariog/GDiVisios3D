import { ArcGisPoint } from './arcgis-point';

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import Circle from '@arcgis/core/geometry/Circle';

import { ILiteEvent, LiteEvent } from '../../LiteEvent';

export class ArcGisCircle {
    private readonly onRemoveFromGraphicsLayer = new LiteEvent<ArcGisCircle>();

    private circle?: Circle; // Use the imported Circle type
    private graphic?: Graphic;
    private graphicsLayer: GraphicsLayer;
    private symbol: SimpleFillSymbol;
    private _locked: boolean;
    private radius: any;

    constructor(graphicsLayer: GraphicsLayer, symbol: SimpleFillSymbol, radius: any) {
        this.symbol = symbol;
        this.graphicsLayer = graphicsLayer;
        this.radius = radius;
        this._locked = false;
    }

    get RemovedFromGraphicsLayer(): ILiteEvent<ArcGisCircle> {
        return this.onRemoveFromGraphicsLayer.expose();
    }

    removeFromGraphicsLayer(): void {
        if (this.graphic) {
            if (this.graphic.layer instanceof GraphicsLayer) {
                this.graphic.layer.remove(this.graphic);
                this.onRemoveFromGraphicsLayer.trigger(this);
            } else {
                console.error("Can't remove graphic from graphics layer if graphic is not added to layer", this);
            }
        } else {
            console.error('No graphic to remove.', this);
        }
    }

    addCircle(point: ArcGisPoint): void {
        if (this._locked) {
            console.error('Circle is locked, no more circles can be added', this);
            return;
        }

        this.circle = new Circle({
            radius: this.radius,
            center: point.MapPoint
        });

        point.addToGraphicsLayer();
        this.addToGraphicsLayer();
    }

    addToGraphicsLayer(): void {
        if (this.circle) {
            this.circle.hasZ = false;
        }
        this.graphic = new Graphic({
            geometry: this.circle,
            symbol: this.symbol
        });
        this.graphicsLayer.add(this.graphic);
    }

    get isLocked(): boolean {
        return this._locked;
    }

    get Circle(): Circle | undefined {
        return this.circle;
    }

    lock(): void {
        this._locked = true;
    }
}