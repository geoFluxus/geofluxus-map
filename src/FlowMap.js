import Map from './Map';
import { _default } from './utils.js';
import * as d3 from 'd3';
import {Layer} from 'ol/layer';
import SourceState from 'ol/source/State';
import {fromLonLat, toLonLat} from 'ol/proj';
import {getCenter, getWidth} from 'ol/extent';
import {transform, transformExtent} from 'ol/proj';


// function to draw arc
var drawArc = function(features) {
    var _this = this;

    // arc offset
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
        var source = _this.getPixelFromCoordinate([d.source.lon, d.source.lat]),
            target = _this.getPixelFromCoordinate([d.target.lon, d.target.lat]);

        _this.g.append('path')
        .attr('d', bezier([source, target]))
        .attr("stroke-opacity", 0.5)
        .attr("stroke", d.color)
        .attr("stroke-width", d.strokeWidth)
        .attr("stroke-linecap", "round")
        .attr("fill", 'none')
    })
}


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
        this.minFlowWidth = options.minFlowWidth || 1;

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

        // define colors based on groupby property
        this.colors = (Array.isArray(this.scale)) ? this._getColors() : this.scale;

        // if not nodes or links in data,
        // convert to links & nodes
        this._transformToLinksAndNodes();

        // load colors to links
        this._colorLinks();

        // process to render map anew
        this._render();
    }

    // render
    _render() {
        // get max link amount to scale flows
        this._getMaxFlowValue();

        // draw links
        this._drawLinks();
    }

    // define colors based on groupby property
    _getColors() {
        var _this = this,
            links = this.data.links;

        this.scale = d3.interpolateRgbBasis(this.scale);

        // get unique categories
        var categories = [];
        links.forEach(function(link) {
            var value = link[_this.groupBy];
            if (!categories.includes(value)) categories.push(value);
        })

        // interpolate
        var colors = {};
        for (var i = 0; i < categories.length; i++) {
            colors[categories[i]] = this.scale(i / categories.length);
        }

        return colors;
    }

    // convert data to links & nodes
    // get link layers
    _transformToLinksAndNodes() {
        var _this =  this;

        var nodes = new Set(),
            links = [];

        // split data to nodes & links
        this.data.forEach(function(flow) {
            // load unique nodes
            var source = JSON.stringify(flow.source),
                target = JSON.stringify(flow.target);
            nodes.add(source);
            nodes.add(target);

            // load link
            links.push(flow);
        })

        // link -> source / target
        nodes = Array.from(nodes);
        var idx = {};  // keep track of indexes
        nodes.forEach(function(n, i) {
            idx[n] = i;
        })
        links.forEach(function(l) {
            l._source = idx[JSON.stringify(l.source)];
            l._target = idx[JSON.stringify(l.target)];
        })

        // source / target -> link
        nodes.forEach(function(n, i) {
            nodes[i] = JSON.parse(n);
            nodes[i]._sourceLinks = [];
            nodes[i]._targetLinks = [];
        })
        links.forEach(function(l, i) {
            nodes[l._source]._sourceLinks.push(i);
            nodes[l._target]._targetLinks.push(i);
        })

        // load to data
        this.data = {
            nodes: nodes,
            links: links
        }
    }

    // load colors to links
    _colorLinks() {
        var _this = this,
            links = this.data.links;

        links.forEach(function(link) {
            link.color = _this.colors[link[_this.groupBy]];
        })
    }

    // get max link amount to scale flows
    _getMaxFlowValue() {
        var _this = this;

        // collect flows with same source and target
        this.flows = {};
        this.data.links.forEach(function(link) {
            var id = link._source + '-' + link._target;
            if (!_this.flows[id]) _this.flows[id] = [];
            _this.flows[id].push(link);
        })

        // compute maximum value of flows
        var totalValues = [];
        Object.values(this.flows).forEach(function(links) {
            var totalValue = 0;
            links.forEach(function (c) {
                totalValue += c.amount
            });
            totalValues.push(totalValue)
        })
        this.maxFlowValue = Math.max(...totalValues);

        // get flow width based on amount
        this._getFlowWidth();
    }

    // get flow width based on amount
    _getFlowWidth() {
        // normalize flow width
        var maxFlowWidth = this.maxFlowWidth,
            minFlowWidth = this.minFlowWidth,
            normFactor = maxFlowWidth / this.maxFlowValue;
        this.data.links.forEach(function(link) {
            var calcWidth = (link.amount) * normFactor,
                strokeWidth = Math.max(minFlowWidth, calcWidth);
            link.strokeWidth = strokeWidth;
        })
    }

    // get map extent based on nodes
    _getExtent() {
        var nodes = this.data.nodes;

        // focus on Netherlands by default
        var topLeft = [
                Math.min(...nodes.map(n => n.lon)),
                Math.max(...nodes.map(n => n.lat))
            ],
            bottomRight = [
                Math.max(...nodes.map(n => n.lon)),
                Math.min(...nodes.map(n => n.lat))
            ];

        return [
            topLeft[0],
            topLeft[1],
            bottomRight[0],
            bottomRight[1]
        ];
    }

    // draw links
    _drawLinks() {
        var links = this.data.links;

        // add flows layer to map
        var d3Layer = new D3Layer({
            name: 'flows',
            map: this.map,
            features: links,
            draw: drawArc
        });
        this.map.addLayer(d3Layer);

        // focus on flows layer extent
        var extent = this._getExtent();
        this.focusOnLayer(extent);
    }
}


class D3Layer extends Layer {
    constructor(options) {
        options = options || {};
        super({name: options.name});
        var _this = this;

        // layer map
        this.map = options.map;

        // layer source of features
        this.features = options.features;

        // feature draw function
        this.draw = options.draw;

        // svg element
        this.svg = d3
          .select(document.createElement('div'))
          .append('svg')
          .style('position', 'absolute');
        this.g = this.svg.append("g");

        // draw layer only on moveend
        function onMoveEnd(evt) {
            _this.draw(_this.features);
        }
        function onMoveStart(evt) {
            _this.clear();
        }
        this.map.on('movestart', onMoveStart);
        this.map.on('moveend', onMoveEnd);
    }

    // convert coordinates to pixels
    // requires input data coordinates in EPSG:4326
    getPixelFromCoordinate(coords) {
        var coords = transform(coords, 'EPSG:4326', 'EPSG:3857');
        return this.map.getPixelFromCoordinate(coords);
    }

    // clear svg of features
    clear() {
        this.g.selectAll("*").remove();
    }

    // render layer (internal OpenLayers function)
    render(frameState) {
        var _this = this;

        // get map framestate
        var width = frameState.size[0],
            height = frameState.size[1];

        this.svg.attr('width', width);
        this.svg.attr('height', height);

        return this.svg.node();
    }
}