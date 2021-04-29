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
        this.groupBy = options.groupBy;
        this.maxFlowWidth = options.maxFlowWidth || 50;

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
        this.colors = this._getColors();

        this._render(); // process to render map anew
    }

    // define category colors
    _getColors() {
        var _this = this;

        // get unique categories
        var categories = [];
        this.data.forEach(function(d) {
            var value = d[_this.groupBy];
            if (!categories.includes(value)) categories.push(value);
        })

        // interpolate
        var colors = {};
        for (var i = 0; i < categories.length; i++) {
            colors[categories[i]] = this.scale(i / categories.length);
        }

        return colors;
    }

    // render
    _render() {
        // if not nodes or links in data,
        // convert to links & nodes
        if (!this.data.nodes || !this.data.links) this._transformToLinksAndNodes();

        // get max link amount to scale flows
        this._getMaxLinkAmount();

        // draw links
        this._drawLinks();
    }

    // convert data to links & nodes
    // get link layers
    _transformToLinksAndNodes() {
        var _this =  this;

        var nodes = [],
            links = this.data;

//        var nodes = new Set(),
//            linkLayers = new Set(),
//            links = [];
//
//        // split data to nodes & links
//        this.data.forEach(function(flow) {
//            // load unique nodes
//            var source = JSON.stringify(flow.source),
//                target = JSON.stringify(flow.target);
//            nodes.add(source);
//            nodes.add(target);
//
//            // load link
//            flow.source = source;
//            flow.target = target;

//
//            // add link layer
//            linkLayers.add(flow[_this.groupBy]);
//        })
//
//        // link -> source / target
//        nodes = Array.from(nodes);
//        var idx = {};  // keep track of indexes
//        nodes.forEach(function(n, i) {
//            idx[n] = i;
//        })
//        links.forEach(function(l) {
//            l.source = idx[l.source];
//            l.target = idx[l.target];
//        })
//
//        // source / target -> link
//        nodes.forEach(function(n, i) {
//            nodes[i] = JSON.parse(n);
//            nodes[i].sourceLinks = [];
//            nodes[i].targetLinks = [];
//        })
//        links.forEach(function(l, i) {
//            nodes[l.source].sourceLinks.push(i);
//            nodes[l.target].targetLinks.push(i);
//        })

        // load to data
        this.data = {
            nodes: nodes,
            links: this.data
        }
    }

    // get max link amount to scale flows
    _getMaxLinkAmount() {
        var links = this.data.links,
            amounts = [];
        links.forEach(function(l) {
            amounts.push(l.amount)
        });
        this.maxLinkAmount = Math.max(...amounts);
    }


    _drawLinks() {
        var _this = this,
            links = this.data.links;

        // function to draw path
        var draw = function(features) {
            var _this = this;
            var sx = 0.4,
            sy = 0.1;

            function bezier(points) {
                // Set control point inputs
                var source = {x: points[0][0], y: points[0][1]},
                    target = {x: points[1][0], y: points[1][1]},
                    dx = source.x - target.x,
                    dy = source.y - target.y;
                    sx -= 0.3 / features.length,
                    sy += 0.3 / features.length;

                // bezier or arc
                var controls = [sx * dx, sy * dy, sy * dx, sx * dy];

                return "M" + source.x + "," + source.y +
                    "C" + (source.x - controls[0]) + "," + (source.y - controls[1]) +
                    " " + (target.x + controls[2]) + "," + (target.y + controls[3]) +
                    " " + target.x + "," + target.y;
            };

            features.forEach(function(d) {
                var o = _this.projection([d.source.lon, d.source.lat]),
                    d = _this.projection([d.target.lon, d.target.lat]);

                _this.svg.append('path')
                .attr('d', bezier([o, d]))
                .attr("stroke", 'red')
                .attr("fill", 'none')
            })
        }

        var d3Layer = new D3Layer({
            name: 'flows',
            map: _this.map,
            features: links,
            draw: draw
        });
        _this.map.addLayer(d3Layer);
    }
}


class D3Layer extends Layer {
    constructor(options) {
        options = options || {};
        super({name: options.name});

        this.map = options.map;  // OpenLayers map
        this.features = options.features;
        this.draw = options.draw;

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

    clear() {
        this.svg.selectAll("*").remove();
    }

    render(frameState) {
        // get map framestate
        var width = frameState.size[0],
            height = frameState.size[1];

        // resize svg & clean
        this.svg.attr('width', width);
        this.svg.attr('height', height);
        this.clear();

        // draw features
        var _this = this;
        this.map.once('postrender', function(){
            _this.draw(_this.features)
        });

        return this.svg.node();
    }
}