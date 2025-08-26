import Color from '@arcgis/core/Color';
import IconSymbol3DLayer from '@arcgis/core/symbols/IconSymbol3DLayer';
import LineSymbol3D from '@arcgis/core/symbols/LineSymbol3D';
import LineSymbol3DLayer from '@arcgis/core/symbols/LineSymbol3DLayer';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer';

export class Symbols {

    static readonly pointSymbol: PointSymbol3D = new PointSymbol3D({
        symbolLayers: [new IconSymbol3DLayer({
            size: 8,
            resource: {
                primitive: 'circle'
            },
            material: {
                color: new Color([0, 0, 0])
            },
            outline: {
                color: new Color([0, 173, 238]),
                size: 1
            },
            anchor: 'center'
        })
        ]
    });

    static readonly lineSymbol: LineSymbol3D = new LineSymbol3D({
        symbolLayers: [new LineSymbol3DLayer({
            size: 2, // points
            material: { color: new Color('red') }
        })]
    });

    static readonly polygonSymbol: SimpleFillSymbol = new SimpleFillSymbol({
        color: new Color([0, 173, 238, 0.6]),
        style: 'backward-diagonal',
        outline: {
            color: new Color([0, 173, 238]),
            width: 1.5
        }
    });

    /* Measure tool symbols */
    /* Blue color, squares */
    static readonly measureToolPoint: PointSymbol3D = new PointSymbol3D({
        symbolLayers: [
            new IconSymbol3DLayer({
                size: 16,
                resource: {
                    primitive: 'square'
                },
                material: {
                    color: new Color([0, 0, 0, 1])
                },
                outline: {
                    color: new Color([0, 173, 238]),
                    size: 1
                },
                anchor: 'center'
            }),
            new TextSymbol3DLayer({
                font: {
                    family: 'monospace'
                },
                material: { color: [255, 255, 255] },
                size: 12
            })
        ]
    });

    static readonly measureToolLine: LineSymbol3D = new LineSymbol3D({
        symbolLayers: [
            new LineSymbol3DLayer({
                size: 2,
                material: {
                    color: new Color([0, 173, 238, 1])
                }
            })
        ]
    });

    /* Draw tool symbols */
    /* Blue color circles */
    static readonly drawToolPoint: PointSymbol3D = new PointSymbol3D({
        symbolLayers: [new IconSymbol3DLayer({
            size: 8,
            resource: {
                primitive: 'circle'
            },
            material: {
                color: new Color([0, 0, 0])
            },
            outline: {
                color: new Color([0, 173, 238]),
                size: 1
            },
            anchor: 'center'
        })
        ]
    });

    static readonly drawToolLine: LineSymbol3D = new LineSymbol3D({
        symbolLayers: [new LineSymbol3DLayer({
            size: 2, // points
            material: { color: new Color([0, 173, 238]) }
        })]
    });

    static readonly drawToolPolygon: SimpleFillSymbol = new SimpleFillSymbol({
        color: new Color([0, 173, 238, 0.6]),
        style: 'backward-diagonal',
        outline: {
            color: new Color([0, 173, 238]),
            width: 1.5
        }
    });

    /* Select tool symbols */
    /* Blue color circles */
    static readonly selectToolPolygon: SimpleFillSymbol = new SimpleFillSymbol({
        color: new Color([0, 173, 238, 0.6]),
        style: 'backward-diagonal',
        outline: {
            color: new Color([0, 173, 238]),
            width: 1.5
        }
    });

    static readonly selectToolCircle: SimpleFillSymbol = new SimpleFillSymbol({
        color: new Color([0, 173, 238, 0.6]),
        style: 'backward-diagonal',
        outline: {
            color: new Color([0, 173, 238]),
            width: 1.5
        }
    });

    static readonly selectToolPoint: PointSymbol3D = new PointSymbol3D({
        symbolLayers: [new IconSymbol3DLayer({
            size: 8,
            resource: {
                primitive: 'circle'
            },
            material: {
                color: new Color([0, 0, 0])
            },
            outline: {
                color: new Color([0, 173, 238]),
                size: 1
            },
            anchor: 'center'
        })
        ]
    });
}
