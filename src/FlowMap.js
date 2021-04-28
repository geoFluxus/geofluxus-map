import Map from './Map';
import { _default } from './utils.js';
import * as d3 from 'd3';
import {Layer} from 'ol/layer';
import SourceState from 'ol/source/State';
import {fromLonLat, toLonLat} from 'ol/proj';
import {getCenter, getWidth} from 'ol/extent';
import {transform} from 'ol/proj';


export default class FlowMap extends Map {
    constructor(options) {
        // base layer
        options.base = _default(options.base, {
            source: 'cartodb_dark'
        });

        super(options);

        this.data = options.data || [];

        // color scale (https://colorbrewer2.org)
        // ordinal scale
        this.scale = options.scale || [
            'rgb(158,1,66)',
            'rgb(213,62,79)',
            'rgb(244,109,67)',
            'rgb(253,174,97)',
            'rgb(254,224,139)',
            'rgb(255,255,191)',
            'rgb(230,245,152)',
            'rgb(171,221,164)',
            'rgb(102,194,165)',
            'rgb(50,136,189)',
            'rgb(94,79,162)'
        ];
        this.scale = d3.interpolateRgbBasis(this.scale);
        this.colorBy = options.colorBy;
        this.colors = this._getColors();

        this.origins = [];
        this.destinations = [];
        this._draw();
    }

    // define category colors
    _getColors() {
        var _this = this;

        // get unique categories
        var categories = [];
        this.data.forEach(function(d) {
            var value = d[_this.colorBy];
            if (!categories.includes(value)) categories.push(value);
        })

        // interpolate
        var colors = {};
        for (var i = 0; i < categories.length; i++) {
            colors[categories[i]] = this.scale(i / categories.length);
        }

        return colors;
    }

    // draw
    _draw() {
        //this._drawNodes();
        this._drawFlows();
    }

    _drawNodes() {
        var _this = this;

        // load origin & destination nodes
        this.data.forEach(function(d, idx) {
            // origin
            d.origin.flow = idx;
            d.origin.geometry = {
                type: "Point",
                coordinates: [d.origin.lon, d.origin.lat]
            }
            _this.origins.push(d.origin);

            // destination
            d.destination.flow = idx;
            d.destination.geometry = {
                type: "Point",
                coordinates: [d.destination.lon, d.destination.lat]
            }
            _this.destinations.push(d.destination);
        })

        // draw origin nodes
        this.addVectorLayer('origins');
        this.origins.forEach(function(o) {
            _this.addFeature('origins', o.geometry);
        })

        // draw destination nodes
        this.addVectorLayer('destinations');
        this.destinations.forEach(function(d) {
            _this.addFeature('destinations', d.geometry);
        })
    }

    _drawFlows() {
        var draw = function(features) {
            var _this = this;
            var sx = 0.4,
                sy = 0.1;

            features.forEach(function(d) {
                var o = _this.projection([d.origin.lon, d.origin.lat]),
                    d = _this.projection([d.destination.lon, d.destination.lat]);

                function bezier(points) {
                    // Set control point inputs
                    var source = {x: points[0][0], y: points[0][1]},
                        target = {x: points[1][0], y: points[1][1]},
                        dx = source.x - target.x,
                        dy = source.y - target.y;
                        sx -= 0.3 / features.length,
                        sy += 0.3 / features.length;
                    //bezier or arc
                    var controls = [sx * dx, sy * dy, sy * dx, sx * dy];

                    return "M" + source.x + "," + source.y +
                        "C" + (source.x - controls[0]) + "," + (source.y - controls[1]) +
                        " " + (target.x + controls[2]) + "," + (target.y + controls[3]) +
                        " " + target.x + "," + target.y;
                };

                _this.svg.append('path')
                .attr('d', bezier([o, d]))
                .attr("stroke", 'red')
                .attr("fill", 'none')
            })
        }

        var flowsLayer = new D3Layer({
            features: this.data,
            name: 'd3Layer',
            map: this.map,
            draw: draw
        });
        this.map.addLayer(flowsLayer);
    }

}


class D3Layer extends Layer {
    constructor(options) {
        options = options || {};
        super({name: options.name});

        this.map = options.map;  // OpenLayers map
        this.features = options.features;  // layer features
        this.draw = options.draw;  // draw function to render features

        // svg element
        this.svg = d3
          .select(document.createElement('div'))
          .append('svg')
          .style('position', 'absolute');
    }

    //getSourceState() {
    //    return SourceState.READY;
    //}

    projection(coords) {
        // convert coordinates to pixels
        // requires input data coordinates in EPSG:4326
        var coords = transform(coords, 'EPSG:4326', 'EPSG:3857');
        return this.map.getPixelFromCoordinate(coords);
    }

    render(frameState) {
        // get map framestate
        var width = frameState.size[0],
            height = frameState.size[1];

        // resize svg & clean
        this.svg.attr('width', width);
        this.svg.attr('height', height);
        this.svg.selectAll("*").remove();

        // draw features
        var _this = this;
        this.map.once('postrender', function(){
            _this.draw(_this.features)
        });

        return this.svg.node();
    }
}