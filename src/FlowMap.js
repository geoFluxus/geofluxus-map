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

        // default properties
        var _this = this;
        this.data = options.data || [];
        this.groupBy = options.groupBy;  // group flows by property
        this.maxFlowWidth = options.maxFlowWidth || 50;
        this.minFlowWidth = options.minFlowWidth || 1;
        this.animate = 0; // no animation
        this.toHide= []; // to hide groupBy categories

        // custom d3 tooltip
        this.tooltip = d3.select("body")
                         .append("div")
                         .attr("class", "d3-tooltip")
                         .style("display", 'none')
                         .style("color", 'white')
                         .style("position", "absolute");

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

        // get legend
        this.legendOptions = options.legend || {};
        this._drawLegend();

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

    // draw legend
    _drawLegend() {
        var _this = this;
        var options = this.legendOptions;

        // legend div
        if (this.legend != undefined) this.legend.remove();
        this.legend = document.createElement('div');

        // default & custom legend style
        this.legend.style.right = "0.5em";
        this.legend.style.top = "0.5em";
        this.legend.style.color = 'white';
        this.legend.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.legend.style.position = 'absolute';
        this.legend.style.borderRadius = '1rem';
        this.legend.style.padding = '10px';
        Object.entries(options).forEach(function(pair) {
            var [key, value] = pair;
            _this.legend.style[key] = value;
        })

        // create OpenLayers control for legend
        this.legend.id = 'legend';
        var controlPanel = new Control({
            element: this.legend
        });
        this.map.addControl(controlPanel);

        // legend title
        var title = document.createElement('div');
        title.id = "legend-title";
        title.style.textAlign = "center";
        title.style.padding = '10px';
        title.innerHTML = options.title || '<span><b>Legend</b></span>';
        this.legend.appendChild(title);

        // add selectAll
        var selectAll = this._getCheckbox(['Select All', 'none']),
            checkboxes = [];

        // checkboxes for groupby property
        Object.entries(this.colors).forEach(function(entry) {
            var checkbox = _this._getCheckbox(entry);
            checkboxes.push(checkbox);

            // add event
            checkbox.addEventListener('change', function() {
                var id = this.id;
                if (this.checked) {
                    _this.toHide = _this.toHide.filter(function(item) {
                        return item !== id
                    })
                } else {
                    selectAll.checked = false;
                    _this.toHide.push(id);
                }
                _this._render();
                if (!_this.toHide.length) selectAll.checked = true;
            });
            checkbox.checked = true;  // checked by default
        })

        // selectAll event
        selectAll.addEventListener('change', function() {
            for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = this.checked;
                var event = new Event('change');
                checkboxes[i].dispatchEvent(event);
            }
        })
        selectAll.checked = true;  // checked by default
    }

    // create groupBy checkbox
    _getCheckbox(entry) {
        var _this = this,
            [property, color] = entry;

        // div to host checkbox & label
        var div = document.createElement('div')
        div.style.margin = '10px'

        // checkbox wrapper
        var wrapper = document.createElement('div')
        wrapper.style.float = 'left';
        wrapper.style.backgroundColor = `${color}`
        wrapper.style.marginRight = '10px';
        wrapper.style.borderRadius = '3px';

        // checkbox
        var checkbox = document.createElement('input');
        var label = document.createElement('label');
        label.innerHTML = property;
        checkbox.type = 'checkbox';
        checkbox.id = property;

        // append elements
        wrapper.appendChild(checkbox);
        div.appendChild(wrapper);
        div.appendChild(label);
        this.legend.appendChild(div);

        return checkbox;
    }

    // get flows
    _getFlows() {
        var _this = this;

        this.flows = {};
        this.data.links.forEach(function(link) {
            // if toHide, continue
            var property = link[_this.groupBy];
            if (_this.toHide.includes(property)) return;

            // collect links with same source and target
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
                features: this.flows,
                tooltip: this.tooltip
            });
            this.map.addLayer(flowLayer);

            // focus on flows layer extent
            var extent = this._getExtent();
            this.focusOnLayer(extent);
        } else {
            // check animation mode
            flowLayer.animate(this.animate);

            // update features
            flowLayer.features = this.flows;

            // clear layer
            flowLayer.clear();

            // force redraw
            flowLayer.draw();
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
        element.style.top = '12em';
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
        element.style.top = '14.5em';
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