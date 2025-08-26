import { Injectable, Inject } from '@angular/core';
import * as geometryService from '@arcgis/core/rest/GeometryService';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import Point from '@arcgis/core/geometry/Point';
import ProjectParameters from '@arcgis/core/rest/support/ProjectParameters';
import { ConfigService } from './config.service';
import { AppConfig } from '../interfaces/config.interface';

@Injectable()
export class ArcGisGeometryService {

    private appConfig: AppConfig;
    //private geoService: GeometryService;
    private projectionSpatialReference: SpatialReference;

    private _enabled: boolean;

    constructor(private configService: ConfigService) {

        this.appConfig = this.configService.getConfig()!;

        if (this.appConfig.geometryServiceUrl != null && this.appConfig.projectionSpatialReferenceWkid != null) 
        {
            this._enabled = true;
        } 
        else 
        {
            console.warn('No geometry service url or projectionSpatialReferenceWkid specified.');
            this._enabled = false;
        }

        this.projectionSpatialReference = new SpatialReference
        ({
            wkid: this.appConfig.projectionSpatialReferenceWkid == null ? 4326 : this.appConfig.projectionSpatialReferenceWkid
        });
    }

    get Enabled(): boolean {
        return this._enabled;
    }

    triggered: boolean = false;

    async projectPoint(point: Point): Promise<Point | null> {
        if (!this.Enabled) {
            console.error("Geometry service url not set in config.json, can't project point.");
            return null;
        }
        try {
            const params = new ProjectParameters({
                geometries: [point],
                outSpatialReference: this.projectionSpatialReference,
            });
            const result = await geometryService.project(this.appConfig.geometryServiceUrl, params);
            if (result && result.length > 0) {
                return result[0] as Point;
            } else {
                console.warn('No projected point returned from geometry service.');
                return null;
            }
        } catch (error) {
            console.error('Error projecting point:', error);
            return null;
        }
    }
}
