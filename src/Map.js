import 'ol/ol.css';
import {Map as olMap, View} from 'ol';
import {transform, transformExtent} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Circle from 'ol/style/Circle';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import * as olInteraction from 'ol/interaction';
import {Control, FullScreen, defaults as defaultControls} from 'ol/control';
import Overlay from 'ol/Overlay';
import html2canvas from 'html2canvas';
import saveAs from 'file-saver';
import '@fortawesome/fontawesome-free/js/all.js';
import { _default } from './utils.js';
import './base.css';


// map bases
var attributions = {
    osm: '© <a style="color:#0078A8" href="https://www.openstreetmap.org/copyright">OSM</a>',
    cartodb: '© <a style="color:#0078A8" href="http://cartodb.com/attributions">CartoDB</a>',
    none: null
}
var sources = {
    osm: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    cartodb_dark: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    cartodb_light: 'https://cartodb-basemaps-{a-d}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    none: null
}

export default class Map {
    constructor(options) {
        // map options //
        var options = options || {};

        // HTML element to render map
        this.target = options.target; // not optional
        if (this.target == undefined) {
            throw Error('Map DOM is undefined!')
        }

        // map projection
        // default: WGS84 (EPSG:4326) -> Web Mercator (EPSG:3857)
        this.projection = options.projection || 'EPSG:4326';

        // map base
        this.base = options.base || {};
        var baseLayer = this._getBase();

        // map view
        this.view = _default(options.view, {
            zoom: 0,
            center: [0, 0]
        });
        this.view.center = transform(this.view.center, this.projection, 'EPSG:3857');

        // OpenLayers controls
        var controls = _default(options.controls, {
            zoom: true,
            drag: true,
            fullscreen: true,
            reset: true,
            exportPNG: true
        });
        var interactionOptions = {
            doubleClickZoom: controls.zoom,
            keyboardZoom: controls.zoom,
            mouseWheelZoom: controls.zoom,
            dragZoom: controls.zoom,
            keyboardPan: controls.drag,
            dragPan: controls.drag
        };
        var interactions = olInteraction.defaults(interactionOptions);

        // render map
        this.map = new olMap({
            target: this.target,
            layers: [baseLayer],
            view: new View(this.view),
            interactions: interactions,
            controls: defaultControls()
        });

        // add custom controls
        if (controls.reset) this.map.addControl(new Reset({target: this}));
        if (controls.fullscreen) this.map.addControl(new FullScreen());
        if (controls.exportPNG) this.map.addControl(new ExportPNG());

        // activate highlight & tooltips
        this._onHover(options.hover);
    }

    // activate tooltips
    _onHover(options) {
        var options = options || {};

        var _this = this,
            target = this.map.getTargetElement();

        var div = target.querySelector('.ol-tooltip');
        if (!div) {
            div = document.createElement('div');
            div.classList.add('ol-tooltip');
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
            tooltipBody = tooltip.body,
            tooltipStyle = tooltip.style || {};

        // default style options
        //div.style.fontFamily = "'Helvetica', 'Arial', sans-serif";

        // change style options
        Object.entries(tooltipStyle).forEach(function(pair) {
            var [key, value] = pair;
            div.style[key] = value;
        })

        // initialize selection highlighting
        var selected, initialStyle;
        function displayTooltip(evt) {
            // reset style of last selection
            if (selected) selected.setStyle(initialStyle);

            // get feature & layer by pixel
            var pixel = evt.pixel;
            var res = _this.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return [feature, layer];
            });
            var feature, layer;
            if (res != undefined) [feature, layer] = res;

            // update tooltip style & highlight
            if (feature) {
                // set tooltip body
                overlay.setPosition(evt.coordinate);
                div.style.display = 'block'; // show tooltip
                if (tooltipBody != undefined) div.innerHTML = tooltipBody(feature);

                // initialize feature highlight
                selected = feature;
                initialStyle = feature.getStyle() || layer.getStyle();

                // get optional styling
                var highlightStyle = options.style || {},
                    stroke = highlightStyle.stroke || {},
                    fill = highlightStyle.fill || {},
                    zIndex = highlightStyle.zIndex;

                // get initial style of feature
                var initialStroke = initialStyle.getStroke(),
                    initialFill = initialStyle.getFill(),
                    initialZIndex = initialStyle.getZIndex();

                // define OpenLayers style
                highlightStyle = new Style({
                    stroke: new Stroke({
                        color: stroke.color || initialStroke.getColor(),
                        width: stroke.width || initialStroke.getWidth()
                    }),
                    fill: new Fill({
                        color: fill.color || initialFill.getColor()
                    }),
                    zIndex: zIndex || initialZIndex
                });
                feature.setStyle(highlightStyle);
            } else {
                // hide tooltip
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
        if (this._getLayer(name) != undefined) {
            throw Error(`Layer "${name}" already exists!`);
        }

        // define style
        var style = options.style || {},
            stroke = style.stroke || {},
            fill = style.fill || {},
            image = style.image || {};
        stroke.color = stroke.color || 'rgba(100, 150, 250, 1)';
        stroke.width = stroke.width || 1;
        fill.color = fill.color || 'rgb(100, 150, 250, 0.1)';

        // special marker for points
        var imageRadius = imageRadius,
            imageStroke = image.Stroke || {},
            imageFill = image.Fill || {};
        image = new Circle({
            radius: options.radius || 5,
            fill: new Fill({
                color: imageFill.color || 'rgb(100, 150, 250, 0.1)'
            }),
            stroke: new Stroke({
                color: imageStroke.stroke || 'rgba(100, 150, 250, 1)',
                width: imageStroke.width || 1
            })
        });

        var layerStyle = new Style({
            stroke: new Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new Fill({
                color: fill.color
            }),
            image: image
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
        if (this._getLayer(layer) == undefined) {
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
        if (style != undefined) {
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

        // set feature properties
        var props = options.props || {};
        Object.entries(props).forEach(function(pair) {
            var [key, value] = pair;
            feature.set(key, value);
        })
    }

    // focus on layer
    focusOnLayer() {
        // fit to layer with given name
        var extent;
        if (typeof arguments[0] == 'string') {
            var name = arguments[0];

            // get layer
            var layer = this._getLayer(name);
            if (layer == undefined) {
                throw Error(`Layer "${name}" does not exist!`)
            }

            // get layer extent from features
            var source = layer.getSource();
            extent = source.getExtent();
        }
        // fit to given extent
        else {
            extent = arguments[0];
            extent = transformExtent(extent, this.projection, 'EPSG:3857');
        }

        // update map view
        this.map.getView().fit(extent, this.map.getSize());
        this.extent = extent;
    }

    // set layer visibility
    setVisible(name, visible) {
        var layer = this._getLayer(name);
        layer.setVisible(visible);
    }

    // change base layer
    changeBase(base) {
        // remove current base layer
        var baseLayer = this._getLayer('base');
        this.map.removeLayer(baseLayer);

        // add new base layer
        this.base = base;
        baseLayer = this._getBase();
        this.map.getLayers().insertAt(0, baseLayer);
    }

    // get base layer
    _getBase() {
        // load base options
        this.base = _default(this.base, {
            source: 'osm',
            opacity: 1.0
        });
        if (!sources.hasOwnProperty(this.base.source)) {
            throw Error('Unknown map base source!');
        }
        this.attributions = attributions[this.base.source.split('_')[0]];

        // create OpenLayers TileLayer for base
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

        return baseLayer;
    }
}


// reset map view control
class Reset extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<span>&#10227</span>';
        button.className = 'ol-reset';
        button.title = 'Reset map';

        const element = document.createElement('div');
        element.className = 'ol-reset ol-unselectable ol-control';
        element.style.top = '7em';
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // Map target
        this.target = options.target;

        button.addEventListener('click', this.reset.bind(this), false);
    }

    reset() {
        var map = this.target.map,
            extent = this.target.extent;
        map.getView().fit(extent, map.getSize());
    }
}


// export png control
class ExportPNG extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-camera"></i>';
        button.className = 'ol-reset';
        button.title = 'Screenshot';

        const element = document.createElement('div');
        element.className = 'ol-export-png ol-unselectable ol-control';
        element.style.top = '9.5em';
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element,
        });

        button.addEventListener('click', this.exportPNG.bind(this), false);
    }

    exportPNG() {
        var map = this.map_,
            target = map.getViewport();
        // options for html2canvas to filter out all the 'ol-control' elements
        var configOptions = {
            ignoreElements: function(target) {
                var klasses = target.classList;
                return klasses.contains('ol-control') && (target.id != 'legend');
            },
            logging: false
        };
        html2canvas(target, configOptions)
            .then(function(canvas) {
                canvas.toBlob(function(blob) {
                saveAs(blob, 'map.png');
                });
        });
    }
}