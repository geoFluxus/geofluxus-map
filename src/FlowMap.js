import Map from './Map';
import { _default } from './utils';
import * as d3 from 'd3';
import Control from 'ol/control/Control';
import Point from 'ol/geom/Point';
import {FlowLayer, NodeLayer} from './CustomLayer.js';


const provider = (process.env.NODE_ENV === 'production') ? 'mapbox' : 'cartodb';

export default class FlowMap extends Map {
    constructor(options) {
        // base layer
        options.base = _default(options.base, {
            source: `${provider}_dark`
        });

        // FlowMap controls
        options.controls = _default(options.controls, {
            toggleFlows: true,
            toggleNodes: true,
            animate: true,
            toggleLegend: true,
            toggleLight: true
        });
        options.controlClasses = {
            toggleFlows: ToggleFlows,
            toggleNodes: ToggleNodes,
            animate: Animate,
            toggleLegend: ToggleLegend,
            toggleLight: ToggleLight
        }
        super(options);

        // change button & logo style
        this.buttonColor = 'white';
        this.stylizeButtons({color: this.buttonColor});
        this.addLogo(this.buttonColor);
        this.addMapboxLogo(this.buttonColor);

        // default properties
        var _this = this;
        this.data = JSON.parse(JSON.stringify(options.data || []));  // shallow copy
        this.groupBy = options.groupBy;  // group flows by property
        this.maxFlowWidth = options.maxFlowWidth || 50;
        this.minFlowWidth = options.minFlowWidth || 1;
        this.animate = options.animate || 0; // no animation
        this.toHide= []; // to hide groupBy categories

        // custom d3 svg
        this.svg = d3
          .select(document.createElement('div'))
          .append('svg')
          .style('position', 'absolute');

        // custom d3 tooltip
        this.tooltip = d3.select(`#${options.target}`)
                         .append("div")
                         .attr("class", "d3-tooltip");
        var tooltipOptions = options.tooltip || {};
        this.tooltipBody = tooltipOptions.body || function(d) {
            if (d.source) return `<span>${d[options.groupBy]}: ${d.amount.toFixed(2)}</span>`;
            return `<span>(${d.lon.toFixed(2)}, ${d.lat.toFixed(2)})`;
        };
        this.tooltipStyle = _default(tooltipOptions.style, {
            visibility: "hidden",
            position: "absolute",
            color: 'white',
            fontFamily: "Helvetica, Arial, sans-serif",
            padding: '0.5em',
            fontSize: '15px',
            backgroundColor: 'rgba(139, 138, 138, 1)',
            borderRadius: '1.5rem'
        });
        Object.entries(this.tooltipStyle).forEach(function(pair) {
            var [key, value] = pair;
            _this.tooltip.node().style[key] = value;
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

        // focus on extent
        var extent = this._getExtent();
        this.focusOnLayer(extent);

        // define colors based on groupby property
        this.colors = (Array.isArray(this.scale)) ? this._getColors() : this.scale;

        // load colors to links
        this._colorLinks();

        // get legend
        this.legendOptions = options.legend || {};
        this._drawLegend();

        // process to render map anew
        this.renderFlows = true;
        this.renderNodes = false;
        this._render();
    }

    // render
    _render() {
        // convert links to flows
        this._getFlows();

        // update nodes
        this._getNodes();

        // clear svg before draw
        this.svg.selectAll("*").remove();

        // draw flows
        if (this.renderFlows) this._drawFlows();

        // draw nodes
        if (this.renderNodes) this._drawNodes();
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
        categories.sort();

        // interpolate
        var colors = {};
        if (categories.length > 1) {
            for (var i = 0; i < categories.length; i++) {
                var norm = i / (categories.length - 1);
                colors[categories[i]] = this.scale(norm);
            }
        } else {
            colors[categories[0]] = this.scale(0);
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
        links.forEach(function(l, i) {
            l._id = i;
            l._source = idx[JSON.stringify(l.source)];
            l._target = idx[JSON.stringify(l.target)];
        })

        // source / target -> link
        nodes.forEach(function(n, i) {
            nodes[i] = JSON.parse(n);
            nodes[i]._id = i;
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
        var viewport = this.map.getViewport();

        // legend div
        if (this.legend != undefined) this.legend.remove();
        this.legend = document.createElement('div');

        // default & custom legend style
        this.legend.style.right = "0";
        this.legend.style.bottom = "0";
        this.legend.style.color = 'white';
        this.legend.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.legend.style.position = 'absolute';
        //this.legend.style.borderRadius = '1rem';
        this.legend.style.padding = '10px';
        this.legend.style.maxWidth = '33%';
        this.legend.style.maxHeight = 'calc(100% - 20px)';
        this.legend.style.overflowY = 'auto';
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

        // add checkboxes
        this._addCheckboxes();
    }

    // add legend checkboxes
    _addCheckboxes() {
        var _this = this;

        // add selectAll
        this.selectAll = this._getCheckbox(['Select All', 'none']);
        this.checkboxes = [];

        // checkboxes for groupby property
        Object.entries(this.colors).forEach(function(entry) {
            var checkbox = _this._getCheckbox(entry);
            _this.checkboxes.push(checkbox);

            // add event
            checkbox.addEventListener('change', function() {
                var id = this.id;
                if (this.checked) {
                    _this.toHide = _this.toHide.filter(function(item) {
                        return item !== id
                    })
                } else {
                    _this.selectAll.checked = false;
                    _this.toHide.push(id);
                }
                _this._render();
                if (!_this.toHide.length) _this.selectAll.checked = true;
            });
            checkbox.checked = true;  // checked by default
        })

        // selectAll event
        this.selectAll.addEventListener('change', function() {
            // show / hide all properties
            if (this.checked) {
                _this.toHide = [];
            } else {
                Object.keys(_this.colors).forEach(function(id) {
                    _this.toHide.push(id)
                })
            }

            // (un)check all checkboxes
            for (var i = 0; i < _this.checkboxes.length; i++) {
                _this.checkboxes[i].checked = this.checked;
            }

            _this._render();
        })
        this.selectAll.checked = true;  // checked by default
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
        wrapper.style.display = 'flex';
        wrapper.style.alignItems= 'center';

        // checkbox
        var checkbox = document.createElement('input');
        var label = document.createElement('label');
        label.innerHTML = property;
        label.style.fontSize = '15px';
        label.style.display = 'flex';
        label.style.alignItems = 'flex';
        checkbox.type = 'checkbox';
        checkbox.id = property;
        checkbox.style.cursor = 'pointer';
        checkbox.style.margin = '3px';

        // append elements
        wrapper.appendChild(checkbox);
        div.appendChild(wrapper);
        div.appendChild(label);
        this.legend.appendChild(div);

        return checkbox;
    }

    // select groupby value(s) to show
    select(ids) {
        ids = ids || [];

        this.selectAll.checked = false;
        var event = new Event('change');
        this.selectAll.dispatchEvent(event);

        for (var i = 0; i < this.checkboxes.length; i++) {
            var checkbox = this.checkboxes[i],
                id = checkbox.id;
            if (ids.includes(id)) {
                checkbox.checked = true;
                var event = new Event('change');
                checkbox.dispatchEvent(event);
            }
        }
    }

    // get flows
    _getFlows() {
        var _this = this;

        this.flows = {};
        this.data.links.forEach(function(link) {
            // change link visibility
            var property = link[_this.groupBy].toString();
            var visible = _this.toHide.includes(property) ? false : true;
            link.visible = visible;

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

    // draw nodes
    _getNodes() {
        var nodes = this.data.nodes,
            links = this.data.links;

        // change node visibility
        nodes.forEach(function(node) {
            // set default to false
            node.visible = false;

            // check source / target links
            // if visible link, turn node to visible &
            // stop search
            function search(items) {
                for (var id of items) {
                    if (links[id].visible) {
                        node.visible = true;
                        break;
                    }
                }
            }
            search(node._sourceLinks);
            if (!node.visible) search(node._targetLinks);
        })
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
                Math.min(...nodes.map(n => n.lat))
            ],
            bottomRight = [
                Math.max(...nodes.map(n => n.lon)),
                Math.max(...nodes.map(n => n.lat))
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
        // remove flow layer
        var flowLayer = this._getLayer('flows');
        if (flowLayer) this.map.removeLayer(flowLayer);

        // add flows layer to map (D3 Layer)
        var flowLayer = new FlowLayer({
            name: 'flows',
            map: this.map,
            features: this.flows,
            svg: this.svg,
            tooltip: {
                element: this.tooltip,
                body: this.tooltipBody
            }
        });
        this.map.addLayer(flowLayer);

        // check animation mode
        flowLayer.animate(this.animate);

        // force draw
        this.map.renderSync();
        flowLayer.draw();
    }

    // draw nodes
    _drawNodes() {
        var _this = this;

        // remove node layer
        var nodeLayer = this._getLayer('nodes');
        if (nodeLayer) this.map.removeLayer(nodeLayer);

        // add flows layer to map (D3 Layer)
        var nodeLayer = new NodeLayer({
            name: 'node',
            map: this.map,
            features: this.data.nodes,
            svg: this.svg,
            tooltip: {
                element: this.tooltip,
                body: this.tooltipBody
            }
        });
        this.map.addLayer(nodeLayer);

        // force draw
        this.map.renderSync();
        nodeLayer.draw();
    }
}


// toggle flows control
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
        element.style.top = options.top;
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
        this.target.renderFlows = !this.target.renderFlows;
        this.target._render();
    }
}


// toggle nodes control
class ToggleNodes extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-crosshairs"></i>';
        button.className = 'ol-toggle-nodes';
        button.title = "Toggle nodes"

        const element = document.createElement('div');
        element.className = 'ol-toggle-nodes ol-unselectable ol-control';
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.toggleNodes.bind(this), false);
    }

    toggleNodes() {
        this.target.renderNodes = !this.target.renderNodes;
        this.target._render();
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
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.animate.bind(this), false);
    }

    animate() {
        this.target.animate++;
        this.target._render();
    }
}


// toggle legend control
class ToggleLegend extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-palette"></i>';
        button.className = 'ol-toggle-legend';
        button.title = "Toggle legend"

        const element = document.createElement('div');
        element.className = 'ol-toggle-legend ol-unselectable ol-control';
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.toggleLegend.bind(this), false);
    }

    toggleLegend() {
        var legend = this.target.legend;
        legend.style.display = legend.style.display == 'none' ? 'block' : 'none';
    }
}


// toggle light control
class ToggleLight extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-lightbulb"></i>';
        button.className = 'ol-toggle-light';
        button.title = "Toggle light"

        const element = document.createElement('div');
        element.className = 'ol-toggle-light ol-unselectable ol-control';
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.toggleLight.bind(this), false);
    }

    toggleLight() {
        var base = this.target.base;

        // change map base layer
        base.source = base.source == `${provider}_dark` ? `${provider}_light` : `${provider}_dark`;
        this.target.changeBase(base);

        // change button style
        this.target.buttonColor = this.target.buttonColor == 'white' ? 'black' : 'white';
        this.target.stylizeButtons({color: this.target.buttonColor});

        // change logo
        this.target.addLogo(this.target.buttonColor)
        this.target.addMapboxLogo(this.target.buttonColor)
    }
}
