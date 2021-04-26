import Map from './Map';
import { _default } from './utils.js';
import * as d3 from 'd3';


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
        this._drawNodes();
    }

    _drawNodes() {
        var _this = this;

        // load origin & destination nodes
        this.data.forEach(function(d) {
            // origin
            d.origin.geometry = {
                'type': 'Point',
                'coordinates': [d.origin.lon, d.origin.lat]
            };
            _this.origins.push(d.origin);

            // destination
            d.destination.geometry = {
                'type': 'Point',
                'coordinates': [d.destination.lon, d.destination.lat]}
            ;
            _this.destinations.push(d.destination);
        })

        // draw origin nodes
        this.addVectorLayer('origins');
        this.origins.forEach(function(o) {
            _this.addFeature('origins', o.geometry)
        })

        // draw destination nodes
        this.addVectorLayer('destinations');
        this.destinations.forEach(function(d) {
            _this.addFeature('destinations', d.geometry)
        })
    }
}