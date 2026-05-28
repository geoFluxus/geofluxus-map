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
        this.svg = options.svg;
        this.g = this.svg.append("g");
        this.defs = this.svg.append("defs");

        // draw layer only on moveend
        function onMoveEnd(evt) {
            _this.draw();
        }
        function onMoveStart(evt) {
            _this.clear();
            _this.tooltip.style('visibility', 'hidden');
        }
        this.map.on('movestart', onMoveStart);
        this.map.on('moveend', onMoveEnd);

        // layer tooltip
        this.tooltip = options.tooltip.element;
        this.tooltipBody = options.tooltip.body;

        // click event
        this.onClick = options?.onClick
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


// flows layer - FlowMap
export class FlowLayer extends D3Layer {
    constructor(options) {
        options = options || {};
        super(options);

        this.mode = 'none';
        this.animateOptions = {};
        this.minWidth = options.minWidth ?? 7;
        this.inactiveOpacity = options.inactiveOpacity ?? 0.4;
        this.selected = options.selected ?? null;
        this.onSelect = options.onSelect || (() => {});
    }

    bezier(options) {
        var source = options.source,
            target = options.target;

        source = {x: source[0], y: source[1]};
        target = {x: target[0], y: target[1]};

        var dx = source.x - target.x,
            dy = source.y - target.y,
            sx = options.xShift || 0.4,
            sy = options.yShift || 0.1;

        var controls = [sx * dx, sy * dy, sy * dx, sx * dy];

        return "M" + source.x + "," + source.y +
            "C" + (source.x - controls[0]) + "," + (source.y - controls[1]) +
            " " + (target.x + controls[2]) + "," + (target.y + controls[3]) +
            " " + target.x + "," + target.y;
    }

    setSelectedAnimation(selection) {
        selection
            .attr("stroke-linecap", "unset")
            .attr("stroke-dasharray", "10,4")
            .attr("stroke-dashoffset", 0)
            .classed("animated", true);
    }

    restoreAnimation(selection) {
        selection
            .classed("animated", this.mode === "dash")
            .attr("stroke-linecap", this.mode === "dash" ? "unset" : "round")
            .attr("stroke-dasharray", this.mode === "dash"
                ? [this.animateOptions.length, this.animateOptions.gap].join(",")
                : null
            )
            .attr("stroke-dashoffset", this.mode === "dash"
                ? this.animateOptions.offset
                : null
            );
    }

    restoreDefault(selection) {
        selection.each(function() {
            var path = d3.select(this);

            path
                .attr("stroke-opacity", path.attr("data-default-opacity"))
                .attr("stroke", path.attr("data-default-stroke"));
        });
    }

    drawPath(d, bezier, color, width, isBuffer = false) {
        var _this = this;

        var target = this.map.getTarget();
        var gradRef;

        if (!isBuffer && width > this.minWidth) {
            var gradient = this.defs.append('linearGradient')
                .attr("id", `${target}_grad${d._id}`)
                .attr("x1", bezier.source[0])
                .attr("y1", bezier.source[1])
                .attr("x2", bezier.target[0])
                .attr("y2", bezier.target[1])
                .attr('gradientUnits', "userSpaceOnUse");

            gradient.append('stop')
                .attr('stop-color', color)
                .attr('stop-opacity', 0.2)
                .attr('offset', 0);

            gradient.append('stop')
                .attr('stop-color', color)
                .attr('stop-opacity', 1.0)
                .attr('offset', 1);

            gradRef = `url(#${target}_grad${d._id})`;
        }

        var defaultOpacity = isBuffer ? 0 : (gradRef ? 1 : 0.5);
        var defaultStroke = isBuffer ? "transparent" : (gradRef || color);
        var isSelected = this.selected === d?._id && !isBuffer;
        var initialOpacity = isSelected ? 1 : (this.selected && !isBuffer ? this.inactiveOpacity : defaultOpacity);

        var path = this.g.append('path')
            .attr('d', this.bezier(bezier))
            .attr("data-flow-id", d._id)
            .attr("data-default-opacity", defaultOpacity)
            .attr("data-default-stroke", defaultStroke)
            .attr("stroke-opacity", initialOpacity)
            .attr("stroke", defaultStroke)
            .attr("stroke-width", width)
            .attr("stroke-linecap", this.mode === "dash" ? "unset" : "round")
            .style("pointer-events", "stroke")
            .attr("fill", "none")
            .classed("flow", true)
            .classed("visible-flow", !isBuffer)
            .classed("buffer-flow", isBuffer)
            .classed("animated", !isBuffer && this.mode === "dash");

        if (!isBuffer && this.mode === "dash") {
            path
                .attr("stroke-dasharray", [this.animateOptions.length, this.animateOptions.gap].join(","))
                .attr("stroke-dashoffset", this.animateOptions.offset);
        }

        if (isSelected) {
            this.setSelectedAnimation(path);
        }

        path
            .on("pointerover", function() {
                this.parentNode.appendChild(this);

                d3.select(this).style("cursor", "pointer");

                _this.g.selectAll(`path.visible-flow[data-flow-id="${d._id}"]`)
                    .attr("stroke-opacity", 1)
                    .attr("stroke", color);

                _this.tooltip
                    .html(_this.tooltipBody(d))
                    .style("visibility", "visible");
            })

            .on("pointermove", function(evt) {
                var tooltipSize = _this.tooltip.node().getBoundingClientRect();

                _this.tooltip
                    .style("top", (evt.y - tooltipSize.height) + 'px')
                    .style("left", (evt.x - (tooltipSize.width / 2)) + 'px');
            })

            .on("mouseout", function() {
                if (_this.selected !== d?._id) {
                    var visible = _this.g.selectAll(`path.visible-flow[data-flow-id="${d._id}"]`);

                    _this.restoreDefault(visible);

                    if (_this.selected) {
                        visible.attr("stroke-opacity", _this.inactiveOpacity);
                    }
                }

                _this.tooltip.style("visibility", "hidden");
            })

            .on("pointerup", function(event) {
                _this.selected = d?._id;
                _this?.onSelect?.(d);

                _this.g.selectAll("path.visible-flow")
                    .each(function() {
                        var flow = d3.select(this);
                        var flowId = flow.attr("data-flow-id");

                        _this.restoreAnimation(flow);
                        _this.restoreDefault(flow);

                        if (flowId !== String(d?._id)) {
                            flow.attr("stroke-opacity", _this.inactiveOpacity);
                        }
                    });

                var visible = _this.g.selectAll(`path.visible-flow[data-flow-id="${d._id}"]`);

                visible
                    .attr("stroke-opacity", 1)
                    .attr("stroke", color);

                _this.setSelectedAnimation(visible);
                _this?.onClick?.(d);
            });
    }

    draw() {
        var _this = this;

        var extent = this.map.getView().calculateExtent(this.map.getSize());
        extent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

        var topLeft = [extent[0], extent[1]];
        var bottomRight = [extent[2], extent[3]];

        function within(point) {
            return point[0] >= topLeft[0] &&
                point[1] >= topLeft[1] &&
                point[0] <= bottomRight[0] &&
                point[1] <= bottomRight[1];
        }

        var amounts = [];

        for (var id in this.features) {
            var flows = _this.features[id];

            flows.forEach(function(d) {
                if (!d.visible) return;

                var source = [d.source.lon, d.source.lat];
                var target = [d.target.lon, d.target.lat];

                d.inExtent = false;

                if (within(source) || within(target)) {
                    amounts.push(d.amount);
                    d.inExtent = true;
                }
            });
        }

        amounts.sort(function(a, b) {
            return b - a;
        });

        var minAmount = amounts[1000] || amounts.pop();

        for (var id in this.features) {
            var flows = _this.features[id];

            var shiftStep = 0.3 / flows.length;
            var xShift = 0.4;
            var yShift = 0.1;
            var curve = flows.length > 1 ? 'arc' : 'bezier';

            flows.forEach(function(d) {
                if (!d.visible) return;
                if (!d.inExtent || d.amount < minAmount) return;

                var source = [d.source.lon, d.source.lat];
                var target = [d.target.lon, d.target.lat];

                source = _this.getPixelFromCoordinate(source);
                target = _this.getPixelFromCoordinate(target);

                var bezier = {
                    source: source,
                    target: target,
                    xShift: xShift,
                    yShift: yShift,
                    curve: curve
                };

                _this.drawPath(d, bezier, d.color, d.strokeWidth, false);

                if (d.strokeWidth < _this.minWidth) {
                    _this.drawPath(d, bezier, d.color, _this.minWidth, true);
                }

                xShift -= shiftStep;
                yShift += shiftStep;
            });
        }
    }

    animate(option) {
        var options = ['none', 'dash'];

        option = option % options.length;
        this.mode = options[option];

        switch(this.mode) {
            case 'none':
                this.animateOptions = {};
                break;

            case 'dash':
                this.animateOptions = {
                    length: 10,
                    gap: 4,
                    offset: 0
                };
                break;
        }
    }
}


// nodes layer - FlowMap
export class NodeLayer extends D3Layer {
    constructor(options) {
        options = options || {};
        super(options);
    }

    draw() {
        var _this = this;

        this.features.forEach(function(d) {
            if (!d.visible) return;

            var point = _this.getPixelFromCoordinate([d.lon, d.lat]);
            var path = _this.g.append('circle')
                        .attr("cx", point[0])
                        .attr("cy", point[1])
                        .attr("r", "5px")
                        .attr("fill", "rgba(139, 138, 138, 0.5)")
                        .on("pointerover", function() {
                            d3.select(this).node().parentNode.appendChild(this);
                            d3.select(this).style("cursor", "pointer");

                            // Show and fill tooltip:
                            _this.tooltip
                                .html(_this.tooltipBody(d))
                                .style("visibility", "visible")
                        })
                        .on("pointermove", function(evt) {
                            var tooltipSize = _this.tooltip.node().getBoundingClientRect();
                            _this.tooltip
                                .style("top", (evt.pageY - tooltipSize.height) + 'px')
                                .style("left", (evt.pageX - (tooltipSize.width / 2)) + 'px');
                        })
                        .on("mouseout", function() {
                            _this.tooltip.style("visibility", "hidden")
                        })
        })
    }
}

export default {FlowLayer, NodeLayer};