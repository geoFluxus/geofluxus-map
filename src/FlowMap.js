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
//        options.controls = _default(options.controls, {
//            zoom: false
//        });

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
        this._getMaxFlowValue();

        // draw links
        this._drawLinks();
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

        // compute maximum value
        var totalValues = [];
        Object.values(this.flows).forEach(function(links) {
            var totalValue = 0;
            links.forEach(function (c) {
                totalValue += c.amount
            });
            totalValues.push(totalValue)
        })
        this.maxFlowValue = Math.max(...totalValues);

        // normalize flow width
        var maxFlowWidth = this.maxFlowWidth,
            minFlowWidth = this.minFlowWidth,
            normFactor = maxFlowWidth / _this.maxFlowValue;
        this.data.links.forEach(function(link) {
            var calcWidth = (link.amount) * normFactor,
                strokeWidth = Math.max(minFlowWidth, calcWidth);
            link.strokeWidth = strokeWidth;
        })
    }

    // draw links
    _drawLinks() {
        var _this = this,
            links = this.data.links,
            nodes = this.data.nodes;

        var topLeft = [3, 54],
            bottomRight = [8, 50];
        nodes.forEach(function(node) {
            topLeft = [Math.min(topLeft[0], node.lon), Math.max(topLeft[1], node.lat)];
            bottomRight = [Math.max(bottomRight[0], node.lon), Math.min(bottomRight[1], node.lat)];
        })
        var extent = [topLeft, bottomRight];

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
                var source = _this.projection([d.source.lon, d.source.lat]),
                    target = _this.projection([d.target.lon, d.target.lat]);

                _this.g.append('path')
                .attr('d', bezier([source, target]))
                .attr("stroke-opacity", 0.5)
                .attr("stroke", 'red')
                .attr("stroke-width", d.strokeWidth)
                .attr("stroke-linecap", "round")
                .attr("fill", 'none')
            })
        }

        // add flow layer to map
        var d3Layer = new D3Layer({
            name: 'flows',
            map: _this.map,
            features: links,
            draw: draw,
            extent: extent
        });
        _this.map.addLayer(d3Layer);
    }
}


class D3Layer extends Layer {
    constructor(options) {
        options = options || {};
        super({name: options.name});
        var _this = this;

        this.map = options.map;  // OpenLayers map
        this.features = options.features;
        this.draw = options.draw;

        this.extent = options.extent;

        // svg element
        this.svg = d3
          .select(document.createElement('div'))
          .append('svg')
          .style('position', 'absolute');
        this.g = this.svg.append("g");

        function onMoveEnd(evt) {
          var map = evt.map;
          map.getLayers().forEach(function(l) {
            if (l instanceof D3Layer) {
                l.renderOnMoveEnd()
            }
          })
        }

        function onMoveStart(evt) {
          _this.clear();
        }

        this.map.on('movestart', onMoveStart);
        this.map.on('moveend', onMoveEnd);
    }

    //getSourceState() {
    //    return SourceState.READY;
    //}

    projection(coords, projection) {
        var projection = projection || 'EPSG:4326';
        // convert coordinates to pixels
        // requires input data coordinates in EPSG:4326
        var coords = transform(coords, projection, 'EPSG:3857');
        return this.map.getPixelFromCoordinate(coords);
    }

    clear() {
        this.g.selectAll("*").remove();
    }

    addFeatures() {
        var _this = this;
        this.map.once('postrender', function(){
            _this.draw(_this.features);
        })
    }

    renderOnMoveEnd() {
        this.draw(this.features);
    }

//    bounds() {
//        this.
//    }

    render(frameState) {
        var _this = this;

        // get map framestate
        var width = frameState.size[0],
            height = frameState.size[1],
            zoom = frameState.viewState.zoom;

        this.svg.attr('width', width)
        this.svg.attr('height', height)

//        this.map.once('moveend', function(){
//            var topLeft = _this.projection(_this.extent[0]);
//            var bottomRight = _this.projection(_this.extent[1]);
//            topLeft = [topLeft[0] - 250, topLeft[1] - 250];
//            bottomRight = [bottomRight[0] + 250, bottomRight[1] + 250];
//            var bbox = [topLeft, bottomRight]
//
//            // resize svg & clean
//            _this.svg.attr('width', bottomRight[0] - topLeft[0]);
//            _this.svg.attr('height', bottomRight[1] - topLeft[1]);
////            _this.svg.attr('transform', `scale(${zoom})`)
//            _this.svg.style("left", topLeft[0] + "px")
//            _this.svg.style("top", topLeft[1] + "px");
//             _this.g.attr("transform",
//                "translate(" + -topLeft[0] + "," + -topLeft[1] + ") ");
//
//
//        });

        return this.svg.node();
    }
}