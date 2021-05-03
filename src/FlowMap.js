import Map from './Map';
import { _default } from './utils';
import * as d3 from 'd3';
import Control from 'ol/control/Control';
import FlowLayer from './CustomLayer.js';


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
            toggleFlows: true,
            animate: true,
        });
        var controlClass = {
            toggleFlows: ToggleFlows,
            animate: Animate
        }
        Object.entries(options.controls).forEach(function(pair) {
            var [key, value] = pair;
            if (value) _this.map.addControl(new controlClass[key]({target: _this}));
        })

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
        this.animate = 0; // no animation
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
        var flowLayer = this._getLayer('flows');

        if (!flowLayer) {
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
        } else {
            flowLayer.animate(this.animate);
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

        button.addEventListener('click', this.toggleFlows.bind(this), false);
    }

    toggleFlows() {
        this.target.setVisible('flows', this.visible);
        this.visible = !this.visible;
    }
}


// animate
class Animate extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="far fa-play-circle"></i>';
        button.className = 'ol-animate';
        button.title = "Animate"

        const element = document.createElement('div');
        element.className = 'ol-animate ol-unselectable ol-control';
        element.style.top = '12em';
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        // animation mode
        this.mode = 0;

        button.addEventListener('click', this.animate.bind(this), false);
    }

    animate() {
        this.mode++;
        this.target.animate = this.mode;
        this.target._render();
    }
}