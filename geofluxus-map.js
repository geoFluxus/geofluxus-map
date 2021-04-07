import 'ol/ol.css';
import {Map, View} from 'ol';
import {transform} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';


// map bases
var attributions = {
    osm: '© <a style="color:#0078A8" href="https://www.openstreetmap.org/copyright">OSM</a>',
    cartodb: '© <a style="color:#0078A8" href="http://cartodb.com/attributions">CartoDB</a>'
}
var sources = {
    osm: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    cartodb_dark: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    cartodb_light: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
}

class GeofluxusMap {
    constructor(options) {
        // map options //
        var options = options || {};

        // HTML element to render map
        this.target = options.target; // not optional

        // map projection
        // default: WGS84 (EPSG:4326) -> Web Mercator (EPSG:3857)
        this.projection = options.projection || 'EPSG:4326';

        // map base
        this.base = options.base || {};
        this.base.source = this.base.source || 'osm';
        if (!sources.hasOwnProperty(this.base.source)) {
            throw Error('Unknown map base source!');
        }
        this.attributions = attributions[this.base.source.split('_')[0]];
        this.base.opacity = this.base.opacity || 1.0;

        var source = new XYZ({
            url: sources[this.base.source],
            attributions: [this.attributions],
            crossOrigin: 'anonymous'
        });
        var baseLayer = new TileLayer({
            name: 'base',
            source: source,
            crossOrigin: 'anonymous',
            opacity: this.base.opacity,
            tileOptions: {
                crossOriginKeyword: 'anonymous'
            },
        });

        // map view
        this.view = options.view || {};
        this.view.zoom = this.view.zoom || 0;  // map zoom
        this.view.center = this.view.center || [0, 0];  // map view
        this.view.center = transform(this.view.center, this.projection, 'EPSG:3857');

        // render map
        this.map = new Map({
          target: this.target,
          layers: [baseLayer],
          view: new View(this.view)
        });
    }

    // check if layer exists by name
    _layerExists(name) {
        var exists = false;
        this.map.getLayers().forEach(function(layer) {
            if (layer.get('name') == name) {
                exists = true;
            }
        })
        return exists;
    }

    // get layer by name
    _getLayer(name) {
        if (!this._layerExists) {
            throw Error(`Layer "${name}" does not exist!`)
        }
    }

    // add vector layer to map
    addVectorLayer(name, options) {
        var options = options || {};

        // check if layer exists
        if (this._layerExists(name)) {
            throw Error(`Layer "${name}" already exists!`);
        }

        // define style
        var style = options.style || {},
            stroke = style.stroke || {},
            fill = style.fill || {};
        stroke.color = stroke.color || 'rgba(100, 150, 250, 1)';
        stroke.width = stroke.width || 1;
        fill.color = fill.color || 'rgb(100, 150, 250, 0.1)';
        var layerStyle = new Style({
            stroke: new Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new Fill({
                color: fill.color
            })
        });

        // create & add layer
        var layer = new VectorLayer({
            name: name,
            opacity: options.opacity || 1.0,
            source: new VectorSource(),
            crossOrigin: 'anonymous',
            style: layerStyle
        });
        this.map.addLayer(layer);
    }

    // add geometry to vector layer
    addGeometry(layer, geometry, options) {
        if (!this._layerExists(layer)) {
            throw Error(`Layer "${layer}" does not exist!`)
        }

        var type = geometry.type.toLowerCase();
        geometry.coordinates = geometry.coordinates || {};

        // define geometry
        switch (type) {
            case 'linestring':
                geometry = new LineString(geometry.coordinates);
                break;
            case 'multilinestring':
                geometry = new MultiLineString(geometry.coordinates);
                break;
            case 'polygon':
                geometry = new Polygon(geometry.coordinates);
                break;
            case 'multipolygon':
                geometry = new MultiPolygon(geometry.coordinates);
                break;
            case 'point':
                geometry = new Point(geometry.coordinates);
                break;
            default:
                throw Error('Unsupported geometry type!');
        }

        // define layer feature
        // transform to map projection
        var feature = new Feature({
            geometry: geometry.transform(this.projection, 'EPSG:3857')
        });
        //layer.getSource().addFeature(feature);
    }
}

export default GeofluxusMap;