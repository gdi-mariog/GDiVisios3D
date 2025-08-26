import { ArcGisService } from '../../core/services/arcgis.service';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

import { ToolMode } from './helpers/tool-mode';

interface ITool {
    Hidden: boolean;
    AvailableModes: ToolMode[];
    CurActiveMode: ToolMode;
    Name: string;

    show(): void;
    clear(): void;
}

export abstract class Tool implements ITool {

    protected graphicsLayer: GraphicsLayer;
    protected _curActiveMode: ToolMode;
    protected _availableModes: ToolMode[];
    private _name: string;

    constructor(name: string, availableModes: ToolMode[], arcgisService: ArcGisService) {

        this._name = name;
        this._availableModes = availableModes;
        this._curActiveMode = this._availableModes[0];

        // Add graphics layer and set its spatial reference
        this.graphicsLayer = new GraphicsLayer();
        this.graphicsLayer.listMode = 'hide';
        if(arcgisService.map)
            arcgisService.map.add(this.graphicsLayer);
    }

    get Hidden(): boolean {
        return !this.graphicsLayer.visible;
    }

    set Hidden(hidden: boolean) {
        this.graphicsLayer.visible = !hidden;
    }

    get Name(): string {
        return this._name;
    }

    get AvailableModes(): ToolMode[] {
        return this._availableModes;
    }

    abstract get CurActiveMode(): ToolMode
    abstract set CurActiveMode(newMode: ToolMode)

    isValidToolMode(newMode: ToolMode): boolean {
        if (this._availableModes.indexOf(newMode) !== -1) {
            return true;
        } else {
            return false;
        }
    }
    show(): void {
        this.graphicsLayer.visible = true;
    }

    clear(): void {
        this.graphicsLayer.removeAll();
    }
}
