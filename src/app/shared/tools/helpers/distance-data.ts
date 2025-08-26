import Point from '@arcgis/core/geometry/Point';
import * as geodeticLengthOperator from '@arcgis/core/geometry/operators/geodeticLengthOperator';
import Polyline from '@arcgis/core/geometry/Polyline';

export class DistanceData {

    private _distance3d = 0;
    private _distance2d = 0;
    private _heightDiff = 0;

    // TODO: Use ESRI Distance methods
    static calculate2dDistance(a: Point, b: Point): number {
        let polyline = new Polyline(
            {
                spatialReference: { wkid: 102100 },
                paths: [[
                    [a.x, a.y],
                    [b.x, b.y]]
                ]
            });

        return geodeticLengthOperator.execute(polyline, { unit: 'meters'});
    }

    static calculate3dDistance(a: Point, b: Point): number {
        return Math.sqrt(Math.pow(this.calculate2dDistance(a, b), 2) + Math.pow(this.calculateHeightDiff(a,b), 2));
    }

    static calculateHeightDiff(a: Point, b: Point): number {
        return (b.z ?? 0) - (a.z ?? 0);
    }

    constructor(distance3d: number, distance2d: number, heightDiff: number) {
        this._distance3d = distance3d;
        this._distance2d = distance2d;
        this._heightDiff = heightDiff;
    }

    get Distance3d(): number {
        return this._distance3d;
    }
    get Distance2d(): number {
        return this._distance2d;
    }

    get HeightDiff(): number {
        return this._heightDiff;
    }

    incrementDistance2d(dist: number): void {
        this._distance2d += dist;
    }

    incrementDistance3d(dist: number): void {
        this._distance3d += dist;
    }

    incrementHeightDiff(diff: number): void {
        this._heightDiff += diff;
    }

}
