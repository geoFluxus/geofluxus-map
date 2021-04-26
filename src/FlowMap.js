import Map from './Map';
import { _default } from './utils.js';
import * as d3 from 'd3';
import {Layer} from 'ol/layer';
import SourceState from 'ol/source/State';
import {fromLonLat, toLonLat} from 'ol/proj';
import {getCenter, getWidth} from 'ol/extent';


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
        var d3Layer = new D3Layer({features: this.data});
        this.map.addLayer(d3Layer);
    }
}


class D3Layer extends Layer {
    // https://openlayers.org/en/latest/examples/d3.html
    constructor(options) {
        options = options || {};
        super(options);

        var _this = this;
        this.features = options.features;
        this.geojson = {
            type: "FeatureCollection",
            features: []
        }
        this.features.forEach(function(f) {
            var obj = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [f.origin.lon, f.origin.lat]
                }
            }
            _this.geojson.features.push(obj);
        })

        this.svg = d3
          .select(document.createElement('div'))
          .append('svg')
          .style('position', 'absolute');

        this.svg.append('path').datum(this.geojson).attr('class', 'boundary');
    }

    getSourceState() {
        return SourceState.READY;
    }

    render(frameState) {
        // get map framestate
        var width = frameState.size[0],
            height = frameState.size[1],
            projection = frameState.viewState.projection;

        // define d3 projection
        var d3Projection = d3.geoMercator().scale(1).translate([0, 0]),
            d3Path = d3.geoPath().projection(d3Projection);

        // get pixel bounds
        var pixelBounds = d3Path.bounds(this.geojson);
        var pixelBoundsWidth = pixelBounds[1][0] - pixelBounds[0][0];
        var pixelBoundsHeight = pixelBounds[1][1] - pixelBounds[0][1];

        // get geographic bounds
        var geoBounds = d3.geoBounds(this.geojson);
        var geoBoundsLeftBottom = fromLonLat(geoBounds[0], projection);
        var geoBoundsRightTop = fromLonLat(geoBounds[1], projection);
        var geoBoundsWidth = geoBoundsRightTop[0] - geoBoundsLeftBottom[0];
        if (geoBoundsWidth < 0) {
          geoBoundsWidth += getWidth(projection.getExtent());
        }
        var geoBoundsHeight = geoBoundsRightTop[1] - geoBoundsLeftBottom[1];

        var widthResolution = geoBoundsWidth / pixelBoundsWidth;
        var heightResolution = geoBoundsHeight / pixelBoundsHeight;
        var r = Math.max(widthResolution, heightResolution);
        var scale = r / frameState.viewState.resolution;

        var center = toLonLat(getCenter(frameState.extent), projection);
        d3Projection
          .scale(scale)
          .center(center)
          .translate([width / 2, height / 2]);
        d3Path = d3Path.projection(d3Projection);

        this.svg.attr('width', width);
        this.svg.attr('height', height);
        this.svg.select('path').attr('d', d3Path).attr('fill', 'red');
        return this.svg.node();
    }
}