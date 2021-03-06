import 'ol/ol.css';
import {Map as olMap, View} from 'ol';
import {transform, transformExtent} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Style, Icon, Text} from 'ol/style';
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
import * as olCondition from 'ol/events/condition'
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
        var _this = this;

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

        // add controls
        this._addControls(controls, options.controlClasses);

        // add logo
        const version = require('../package.json').version;
        const source = "https://cdn.jsdelivr.net/npm/geofluxus-map@" + version + "/src/";
        const logo_width = '150px';
        this.logo_light = new Image();
        this.logo_light.src = source + "logo_light.png";
        this.logo_light.style.width = logo_width;
        this.logo_dark = new Image();
        this.logo_dark.src = source + "logo_dark.png";
        this.logo_dark.style.width = logo_width;
        this.addLogo('dark');

        // activate highlight & tooltips
        this._onHover(options.hover);
    }

    _addControls(controls, classes) {
        var _this = this;

        // add custom controls
        if (controls.fullscreen) this.map.addControl(new FullScreen());
        var classes = _default(classes, {
            reset: Reset,
            exportPNG: ExportPNG
        })
        var topPos = 9.5; // position from screen top
        Object.entries(controls).forEach(function(pair) {
            var [key, value] = pair;
            if (controls[key] && classes[key]) {
                _this.map.addControl(new classes[key]({
                    target: _this,
                    top: `${topPos}em`
                }));
                topPos += 2.5;
            }
        })
    }

    addLogo(color) {
        // add logo
        if (this.logo != undefined) {
            this.map.removeControl(this.logo);
        }
        var div = document.createElement('div');
        var logo = color == 'white' ? this.logo_light : this.logo_dark;

        div.appendChild(logo)
        div.id = 'logo';
        div.style.bottom = '1em';
        div.style.left = '1em';
        div.style.position = 'absolute';
        this.logo = new Control({
            element: div
        });
        this.map.addControl(this.logo);
    }

    // activate tooltips
    _onHover(options) {
        var options = options;
        if (options == undefined) return;

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

        // ignore layers
        var ignore = options.ignore || [];

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

            // ignore layers
            if (layer) {
                ignore.forEach(function(i) {
                    if (layer.get('name') == i) feature = null;
                })
            }

            // update tooltip style & highlight
            if (feature) {
                // change cursor style
                this.getViewport().style.cursor = 'pointer';

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
                    zIndex = highlightStyle.zIndex,
                    image = highlightStyle.image;

                // special marker for points
                if (image) {
                    var imageRadius = image.radius,
                    imageStroke = image.stroke || {},
                    imageFill = image.fill || {};

                    // get initial marker style
                    var initialImageStyle = initialStyle.getImage();
                    var initialImageStroke = initialImageStyle.getStroke(),
                        initialImageFill = initialImageStyle.getFill();
                    image = new Circle({
                        radius: imageRadius || initialImageStyle.getRadius(),
                        fill: new Fill({
                            color: imageFill.color || initialImageFill.getColor()
                        }),
                        stroke: new Stroke({
                            color: imageStroke.color || initialImageStroke.getColor(),
                            width: imageStroke.width || initialImageStroke.getWidth()
                        })
                    });
                }

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
                    zIndex: zIndex || initialZIndex,
                    image: image
                });
                feature.setStyle(highlightStyle);
            } else {
                // reset pointer style
                this.getViewport().style.cursor = 'auto';

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
            image = style.image,
            text = style.text;
        stroke.color = stroke.color || 'rgba(100, 150, 250, 1)';
        stroke.width = stroke.width || 1;
        fill.color = fill.color || 'rgb(100, 150, 250, 0.1)';

        style = {
            stroke: new Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new Fill({
                color: fill.color
            })
        }

        // special icon marker for points
        if (image) {
            style.image = image.icon ? new Icon({
                crossOrigin: 'anonymous',
                scale: image.icon.scale || 1,
                src: image.icon.src
            }) : new Circle({
                radius: image.radius || 5,
                fill: new Fill({
                    color: image.fill?.color || 'rgb(100, 150, 250, 0.1)'
                }),
                stroke: new Stroke({
                    color: image.stroke?.color || 'rgba(100, 150, 250, 1)',
                    width: image.stroke?.width || 1
                })
            });
        }

        // vector text
        if (text) {
            style.text = new Text({
                text: text.text || 'text',
                font: `normal ${text.fontSize || 10}px FontAwesome`,
                textBaseline: text.textBaseline || 'middle',
                fill: new Fill({
                    color: text.color || 'black',
                })
            })
        }

        // create & add layer
        var layer = new VectorLayer({
            name: name,
            opacity: options.opacity || 1.0,
            source: new VectorSource(),
            crossOrigin: 'anonymous',
            style: new Style(style)
        });
        this.map.addLayer(layer);

        // define z-index
        layer.setZIndex(style.zIndex);

        // selectable layer
        var select = options.select;
        if (select != undefined) {
            this.addSelectInteraction(layer, select);
        }
    }

    // add select interaction
    // DO NOT ADD WITH HOVER!!!
    addSelectInteraction(layer, options) {
        var _this =  this;

        // pointer cursor over features
        this.map.on('pointermove', function (e) {
            if (e.dragging) return;

            var pixel = _this.map.getEventPixel(e.originalEvent);
            var hit = _this.map.hasFeatureAtPixel(pixel);

            _this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        // define select style
        var style = options.style || {},
            stroke = style.stroke || {},
            fill = style.fill || {},
            image = style.image,
            text = style.text;
        stroke.color = stroke.color || 'rgba(100, 150, 250, 1)';
        stroke.width = stroke.width || 1;
        fill.color = fill.color || 'rgb(100, 150, 250, 0.1)';

        style = {
            stroke: new Stroke({
                color: stroke.color,
                width: stroke.width
            }),
            fill: new Fill({
                color: fill.color
            }),
            zIndex: options.zIndex
        }

        // define select interaction
        var multi = (options.multi == undefined) ? true : options.multi;
        var interaction = new olInteraction.Select({
            toggleCondition: (multi) ? olCondition.always : olCondition.click,
            style: new Style(style),
            layers: [layer],
            multi: multi
        });
        this.map.addInteraction(interaction);
        layer.select = interaction;

        // onChange function
        if (options.onChange) {
            interaction.on('select', function (evt) {
                var ret = [];
                // callback with all currently selected
                interaction.getFeatures().forEach(function (feat) {
                    ret.push(feat.values_);
                })
                options.onChange(ret);
                layer.getSource().dispatchEvent('change');
            })
        }
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
                defaultZIndex = defaultStyle.getZIndex(),
                defaultImage = defaultStyle.getImage(),
                defaultText = defaultStyle.getText();

            var stroke = style.stroke || {},
                fill = style.fill || {},
                zIndex = style.zIndex || {},
                image = style.image,
                text = style.text;

            style = {
                stroke: new Stroke({
                    color: stroke.color || defaultStroke.getColor(),
                    width: stroke.width || defaultStroke.getWidth()
                }),
                fill: new Fill({
                    color: fill.color || defaultFill.getColor()
                }),
                zIndex: style.zIndex || defaultZIndex
            };

            // special icon marker for points
            if (image) {
                style.image = image.icon ? new Icon({
                    crossOrigin: 'anonymous',
                    scale: image.icon.scale || 1,
                    src: image.icon.src
                }) : new Circle({
                    radius: image.radius || 5,
                    fill: new Fill({
                        color: image.fill?.color || 'rgb(100, 150, 250, 0.1)'
                    }),
                    stroke: new Stroke({
                        color: image.stroke?.color || 'rgba(100, 150, 250, 1)',
                        width: image.stroke?.width || 1
                    })
                });
            }

            // vector text
            if (text) {
                style.text = new Text({
                    text: text.text || 'text',
                    font: `normal ${text.fontSize || 10}px FontAwesome`,
                    textBaseline: text.textBaseline || 'middle',
                    fill: new Fill({
                        color: text.color || 'black',
                    })
                })
            }

            feature.setStyle(new Style(style));
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

    // change button style
    stylizeButtons(options) {
        var controls = this.map.getControls();
        controls.forEach(function(control) {
            control.element.childNodes.forEach(function(button) {
                var tag = button.tagName;
                if (tag && tag.toLowerCase() == 'button') {
                    Object.entries(options).forEach(function(pair) {
                        var [key, value] = pair;
                        button.style[key] = value;
                    })
                }
            })
        })
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
        element.style.top = options.top;
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
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element,
        });

        // map target
        this.target = options.target;
        this.button = button;

        button.addEventListener('click', this.exportPNG.bind(this), false);
    }

    exportPNG() {
        var _this = this,
            map = this.map_,
            target = map.getViewport(),
            logo = this.target.logo.element,
            legend = this.target.legend;

        // throw screenshot standby
        var div = document.createElement('div');
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        div.className = 'screenshot-standby';
        div.style.zIndex = 999999;
        div.style.position = 'absolute';
        div.innerHTML = `
            <p style="position: absolute;
                      top: 50%;
                      left: 50%;
                      margin: 0;
                      font-size: 30px;
                      color: white;
                      transform: translate(-50%, -50%);">
                Please wait...
            </p>`;
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.cursor = 'wait';
        target.appendChild(div);

        // print settings
        // A4 landscape - 297 x 210 cm
        // resolution: 300 dpi
        var dim = [297, 210],
            resolution = 300,
            width = Math.round((dim[0] * resolution) / 25.4),
            height = Math.round((dim[1] * resolution) / 25.4),
            size = map.getSize(),
            viewResolution = map.getView().getResolution();

        // resize map for printing
        var printSize = [width, height];
        map.setSize(printSize);
        var scaling = Math.min(width / size[0], height / size[1]);
        map.getView().setResolution(viewResolution / scaling);

        // scale logo
        logo.style.transformOrigin = "bottom left";
        logo.style.transform = `scale(2)`;

        // if map legend, scale & translate for printing
        var legendWidth, legendHeight;
        if (legend) {
            legendWidth = legend.style.maxWidth;
            legendHeight = legend.style.maxHeight;
            legend.style.maxWidth = 'none';
            legend.style.maxHeight = 'none';
            legend.style.transformOrigin = "bottom right";
            legend.style.transform = `scale(2)`;
        }

        // print once map is resized
        // alternative: listen to 'postrender' to not await for tiles
        map.once('rendercomplete', function() {
            // resize map viewport
            target.style.width = width + 'px';
            target.style.height = height + 'px';

            // options for html2canvas to filter out all the 'ol-control' elements
            var configOptions = {
                ignoreElements: function(target) {
                    var klasses = target.classList;
                    return klasses.contains('ol-control') || klasses.contains('screenshot-standby');
                },
                logging: false,
                useCORS: true,
                allowTaint: true,
                scrollX:0,
                scrollY: -window.scrollY
            };
            html2canvas(target, configOptions)
                .then(function(canvas) {
                    canvas.toBlob(function(blob) {
                        // save screenshot as png
                        saveAs(blob, 'map.png');

                        // remove screenshot standby
                        div.remove();
                    });
            });

            // reset viewport
            target.style.width = '100%';
            target.style.height = '100%';

            // reset map
            map.setSize(size);
            map.getView().setResolution(viewResolution);

            // reset logo
            logo.style.transform = 'none';

            // reset legend
            if (legend) {
                legend.style.transform = 'none';
                legend.style.maxWidth = legendWidth;
                legend.style.maxHeight = legendHeight;
            }
        })
    }
}