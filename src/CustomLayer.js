import {Layer} from 'ol/layer';
import * as d3 from 'd3';
import {transform, transformExtent} from 'ol/proj';


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


// flows layer for FlowMap
export default class FlowLayer extends D3Layer {
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