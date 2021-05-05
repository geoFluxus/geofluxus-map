import {Layer} from 'ol/layer';
import * as d3 from 'd3';
import {transform, transformExtent} from 'ol/proj';
import './flowmap.css';


// custom OpenLayers base layer for d3 visualizations
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
        this.defs = this.svg.append("defs");

        // draw layer only on moveend
        function onMoveEnd(evt) {
            _this.draw(_this.features);
        }
        function onMoveStart(evt) {
            _this.clear();
            _this.tooltip.style('visibility', 'hidden');
        }
        this.map.on('movestart', onMoveStart);
        this.map.on('moveend', onMoveEnd);

        // layer tooltip
        this.tooltip = options.tooltip;
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
        this.defs.selectAll("*").remove();
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


// flows layer for FlowMap
export default class FlowLayer extends D3Layer {
    constructor(options) {
        options = options || {};
        super(options)

        this.mode = 'none';
        this.animateOptions = {};
    }

    // build bezier curves
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
            controls = arc;

        return "M" + source.x + "," + source.y +
            "C" + (source.x - controls[0]) + "," + (source.y - controls[1]) +
            " " + (target.x + controls[2]) + "," + (target.y + controls[3]) +
            " " + target.x + "," + target.y
    }

    // draw path
    drawPath(d, bezier, color, width) {
        var _this = this;

        var target = this.map.getTarget();
        if (color != 'none') {
            // color gradient along path
            var gradient = this.defs.append('linearGradient')
                                    .attr("id", `${target}_grad${d._id}`)
                                    .attr("x1", bezier.source[0])
                                    .attr("y1", bezier.source[1])
                                    .attr("x2", bezier.target[0])
                                    .attr("y2", bezier.target[1])
                                    .attr('gradientUnits', "userSpaceOnUse")
            // gradient start
            gradient.append('stop')
                    .attr('stop-color', color)
                    .attr('stop-opacity', 0.2)
                    .attr('offset', 0)

            // gradient stop
            gradient.append('stop')
                    .attr('stop-color', color)
                    .attr('stop-opacity', 1.0)
                    .attr('offset', 1)
        }

        // d3 path
        var gradRef = color == 'none' ? 'none' : `url(#${target}_grad${d._id})`;
        var path = this.g.append('path')
                    .attr('d', this.bezier(bezier))
                    .attr("stroke-opacity", 0.5)
                    .attr("stroke", gradRef)
                    .attr("stroke-width", width)
                    .attr("stroke-linecap", "round")
                    .style("pointer-events", 'stroke')
                    .on("mouseover", function() {
                        d3.select(this).node().parentNode.appendChild(this);
                        d3.select(this).style("cursor", "pointer");
                        path.attr("stroke-opacity", 1);
                        path.attr("stroke", color);

                        // Show and fill tooltip:
                        _this.tooltip
                            .html(_this.getTooltip(d))
                            .style("visibility", "visible")
                    })
                    .on("mousemove", function(evt) {
                        var tooltipSize = _this.tooltip.node().getBoundingClientRect();
                        _this.tooltip
                            .style("top", (evt.pageY - tooltipSize.height) + 'px')
                            .style("left", (evt.pageX - (tooltipSize.width / 2)) + 'px');
                    })
                    .on("mouseout", function() {
                        path.attr("stroke-opacity", 0.5);
                        path.attr("stroke", gradRef);
                        _this.tooltip.style("visibility", "hidden")
                    })
                    .attr("fill", 'none')
                    .classed('flow', true)
                    .classed('animated', this.mode);

        // animation options
        if (this.mode == 'dash') {
            var length = this.animateOptions.length,
                gap = this.animateOptions.gap,
                offset = this.animateOptions.offset;
            path.attr("stroke-linecap", "unset");
            path.attr("stroke-dasharray", [length, gap].join(','));
            path.attr("stroke-dashoffset", offset);
        }
    }

    // function to draw arcs
    draw() {
        var _this = this;

        for (var id in this.features) {
            // get grouped flows
            var flows = _this.features[id];

            // curve properties
            var shiftStep = 0.3 / flows.length,
                xShift = 0.4,
                yShift = 0.1,
                curve = (flows.length > 1) ? 'arc' : 'bezier';

            // draw flows
            flows.forEach(function(d) {
                // if no display, proceed to next flow
                if (d.display == 'none') return;

                // get flow source & target
                // convert to pixels
                var source = [d.source.lon, d.source.lat],
                    target = [d.target.lon, d.target.lat];
                source = _this.getPixelFromCoordinate(source);
                target = _this.getPixelFromCoordinate(target);

                // curve options
                var bezier = {
                    source: source,
                    target: target,
                    xShift: xShift,
                    yShift: yShift,
                    curve: curve
                }

                // draw path
                _this.drawPath(d, bezier, d.color, d.strokeWidth);

                 // buffer path for very thin lines (easier mouseover)
                if (d.strokeWidth < 7) {
                    _this.drawPath(d, bezier, 'none', 7);
                }

                // shift curve
                xShift -= shiftStep;
                yShift += shiftStep;
            })
        }
    }

    // animate flows
    animate(option) {
        var options = ['none', 'dash'],
            option = option % options.length;
        this.mode = options[option];

        // animation options
        switch(this.mode) {
            case 'none':
                this.animateOptions = {};
                break;
            case 'dash':
                this.animateOptions = {
                    length: 10,
                    gap: 4,
                    offset: 0
                }
                break;
        }
    }

    getTooltip(d) {
        return `<span>${d.source.name} <i class="fas fa-arrow-right"></i> ${d.target.name}</span>`
    }
}