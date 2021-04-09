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
import * as olInteraction from 'ol/interaction';
import {FullScreen, defaults as defaultControls} from 'ol/control';
import Overlay from 'ol/Overlay';


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
        this.view.minZoom = this.view.minZoom;
        this.view.maxZoom = this.view.maxZoom;

        // enable zoom & drag interactions
        var enableZoom  = options.enableZoom || false,
            enableDrag = options.enableDrag || false;
        var interactionOptions = {
            doubleClickZoom: enableZoom,
            keyboardZoom: enableZoom,
            mouseWheelZoom: enableZoom,
            dragZoom: enableZoom,
            keyboardPan: enableDrag,
            dragPan: enableDrag
        };
        var interactions = olInteraction.defaults(interactionOptions);

        // render map
        this.map = new Map({
            target: this.target,
            layers: [baseLayer],
            view: new View(this.view),
            interactions: interactions,
            controls: defaultControls().extend([new FullScreen()])
        });

        // activate tooltips
        this._onHover(options.hover);
    }

    // activate tooltips
    _onHover(options) {
        var options = options || {};

        var _this = this,
            target = this.map.getTargetElement();

        var div = target.querySelector('.oltooltip');
        if (!div) {
            div = document.createElement('div');
            div.classList.add('oltooltip');
            target.appendChild(div);
        }
        var overlay = new Overlay({
            element: div,
            offset: [10, 0],
            positioning: 'bottom-center'
        });
        this.map.addOverlay(overlay);

        // initialize tooltip
        var tooltip = options.tooltip || {},
            tooltipStyle = tooltip.style || {};

        // initialize selection highlighting
        var selected = null,
            initialStyle = null,
            highlightStyle = options.style;
        if (highlightStyle !== undefined) {
            var stroke = highlightStyle.stroke,
                fill = highlightStyle.fill;
            highlightStyle = new Style({
                stroke: new Stroke(stroke),
                fill: new Fill(fill),
            });
        }

        function displayTooltip(evt) {
            // reset style of last selection
            if (selected) selected.setStyle(initialStyle);

            // get feature by pixel
            var pixel = evt.pixel;
            var feature = _this.map.forEachFeatureAtPixel(pixel, function (feature) {
                return feature;
            });

            // update tooltip style & highlight
            if (feature) {
                // set tooltip body
                overlay.setPosition(evt.coordinate);
                div.innerHTML = feature.get('tooltip');

                // default options
                div.style.display = 'block';
                div.style.backgroundColor = 'rgba(139, 138, 138, 0.8)';
                div.style.borderRadius = '1.5rem';
                div.style.padding = '0.75rem';
                div.style.fontFamily = 'Montserrat, sans-serif';
                div.style.fontSize = '15px';

                // change style options
                Object.entries(tooltipStyle).forEach(function(pair) {
                    var [key, value] = pair;
                    div.style[key] = value;
                })

                //  highlight feature
                selected = feature;
                initialStyle = feature.getStyle();
                feature.setStyle(highlightStyle);
            } else {
                div.style.display = 'none';
            }
        };

        this.map.on('pointermove', displayTooltip);
    }

    // get layer by name
    _getLayer(name) {
        var response;
        this.map.getLayers().forEach(function(layer) {
            if (layer.get('name') == name) {
                response = layer;
            }
        })
        return response;
    }

    // add vector layer to map
    addVectorLayer(name, options) {
        var options = options || {};

        // check if layer exists
        if (this._getLayer(name) !== undefined) {
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
            }),
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

        // define z-index
        layer.setZIndex(style.zIndex);
    }

    // add feature to vector layer
    addFeature(layer, geometry, options) {
        var options = options || {};

        // check if input layer does exist
        if (this._getLayer(layer) === undefined) {
            throw Error(`Layer "${layer}" does not exist!`)
        }
        layer = this._getLayer(layer);

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

        // individual feature style
        var style = options.style;
        if (style !== undefined) {
            var defaultStyle = layer.getStyle(),
                defaultStroke = defaultStyle.getStroke(),
                defaultFill = defaultStyle.getFill(),
                defaultZIndex = defaultStyle.getZIndex();

            var stroke = style.stroke || {},
                fill = style.fill || {},
                zIndex = style.zIndex || {};

            style = new Style({
                stroke: new Stroke({
                    color: stroke.color || defaultStroke.getColor(),
                    width: stroke.width || defaultStroke.getWidth()
                }),
                fill: new Fill({
                    color: fill.color || defaultFill.getColor()
                }),
                zIndex: style.zIndex || defaultZIndex
            });
            feature.setStyle(style);
        }

        // get layer & add feature
        layer.getSource().addFeature(feature);

        // set tooltip text
        feature.set('tooltip', options.tooltip);
    }

    // focus on layer
    focusOnLayer(name) {
        var layer = this._getLayer(name);
        if (layer === undefined) {
            throw Error(`Layer "${name}" does not exist!`)
        }

        var source = layer.getSource();
        if (source.getFeatures().length) {
            this.map.getView().fit(source.getExtent(), this.map.getSize());
        }
    }
}

export default GeofluxusMap;