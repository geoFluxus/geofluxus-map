import 'ol/ol.css';
import {Map, View} from 'ol';
import {transform} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

// map backgrounds
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
        // HTML element to render map
        this.target = options.target; // not optional

        // map background
        this.background = options.background || {};
        this.background.source = this.background.source || 'osm';
        this.attributions = attributions[this.background.source.split('_')[0]];
        this.background.source = sources[this.background.source];
        this.background.opacity = this.background.opacity || 1.0;
        var source = new XYZ({
            url: this.background.source,
            attributions: [this.attributions],
            crossOrigin: 'anonymous'
        });
        var backgroundLayer = new TileLayer({
            source: source,
            crossOrigin: 'anonymous',
            opacity: this.background.opacity,
            tileOptions: {
                crossOriginKeyword: 'anonymous'
            },
        });

        // map view
        this.view = options.view || {};
        this.view.zoom = this.view.zoom || 0;  // map zoom
        this.view.center = this.view.center || [0, 0];  // map view
        this.view.center = transform(this.view.center, 'EPSG:4326', 'EPSG:3857');

        // render map
        const map = new Map({
          target: this.target,
          layers: [
            backgroundLayer
          ],
          view: new View(this.view)
        });
    }
}

export default GeofluxusMap;