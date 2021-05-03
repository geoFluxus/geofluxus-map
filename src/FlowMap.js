import Map from './Map';
import { _default } from './utils.js';
import * as d3 from 'd3';
import {Layer} from 'ol/layer';
import SourceState from 'ol/source/State';
import {fromLonLat, toLonLat} from 'ol/proj';
import {getCenter, getWidth} from 'ol/extent';
import {transform, transformExtent} from 'ol/proj';
import Control from 'ol/control/Control';


export default class FlowMap extends Map {
    constructor(options) {
        // base layer
        options.base = _default(options.base, {
            source: 'cartodb_dark'
        });
        super(options);

        var _this = this;
        this.data = options.data || [];
        this.groupBy = options.groupBy;
        this.maxFlowWidth = options.maxFlowWidth || 50;
        this.minFlowWidth = options.minFlowWidth || 1;

        // FlowMap controls
        options.controls = _default(options.controls, {
            toggleFlows: true
        });
        var controlClass = {
            toggleFlows: ToggleFlows
        }
        Object.entries(options.controls).forEach(function(pair) {
            var [key, value] = pair;
            if (value) _this.map.addControl(new controlClass[key]({target: _this}));
        })
        this._stylizeButtons();

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

        // if not nodes or links in data,
        // convert to links & nodes
        this._transformToLinksAndNodes();

        // define colors based on groupby property
        this.colors = (Array.isArray(this.scale)) ? this._getColors() : this.scale;

        // load colors to links
        this._colorLinks();

        // process to render map anew
        this._render();
    }

    // render
    _render() {
        // convert links to flows
        this._getFlows();

        // draw flows
        this._drawFlows();
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

    // get flows
    _getFlows() {
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

    // draw flows
    _drawFlows() {
        // add flows layer to map
        var flowLayer = new FlowLayer({
            name: 'flows',
            map: this.map,
            features: this.flows
        });
        this.map.addLayer(flowLayer);

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


class FlowLayer extends D3Layer {
    constructor(options) {
        options = options || {};
        super(options)
    }

    bezier(options) {
        // get source / target
        var source = options.source,
            target = options.target;
        source = {x: source[0], y: source[1]};
        target = {x: target[0], y: target[1]};

        // set control points
        var dx = source.x - target.x,
            dy = source.y - target.y,
            sx = options.xShift || 0.4,
            sy = options.yShift || 0.1;
        var arc = [sx * dx, sy * dy, sy * dx, sx * dy],
            bezier = [sx * dx, sy * dy, sx * dx, sy * dy],
            controls = (options.curve === 'arc') ? arc : bezier;

        return "M" + source.x + "," + source.y +
            "C" + (source.x - controls[0]) + "," + (source.y - controls[1]) +
            " " + (target.x + controls[2]) + "," + (target.y + controls[3]) +
            " " + target.x + "," + target.y;
    }

    // function to draw arc
    draw(features) {
        var _this = this;

        for (var id in features) {
            // get grouped flows
            var flows = _this.features[id];

            // curve properties
            var shiftStep = 0.3 / flows.length,
                xShift = 0.4,
                yShift = 0.1,
                curve = (flows.length > 1) ? 'arc' : 'bezier';

            // draw flows
            flows.forEach(function(d) {
                // get flow source & target
                // convert to pixels
                var source = [d.source.lon, d.source.lat],
                    target = [d.target.lon, d.target.lat];
                source = _this.getPixelFromCoordinate(source);
                target = _this.getPixelFromCoordinate(target);

                var bezierOptions = {
                    source: source,
                    target: target,
                    xShift: xShift,
                    yShift: yShift,
                    curve: curve
                }

                _this.g.append('path')
                .attr('d', _this.bezier(bezierOptions))
                .attr("stroke-opacity", 0.5)
                .attr("stroke", d.color)
                .attr("stroke-width", d.strokeWidth)
                .attr("stroke-linecap", "round")
                .attr("fill", 'none')

                // shift curve
                xShift -= shiftStep;
                yShift += shiftStep;
            })
        }
    }
}


// toggle network control
class ToggleFlows extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-random"></i>';
        button.className = 'ol-toggle-flows';
        button.title = "Toggle flows"

        const element = document.createElement('div');
        element.className = 'ol-toggle-flows ol-unselectable ol-control';
        element.style.top = '9.5em';
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.toggleNetwork.bind(this), false);
    }

    toggleNetwork() {
        this.target.setVisible('flows', this.visible);
        this.visible = !this.visible;
    }
}