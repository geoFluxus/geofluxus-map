import Map from './Map';
import * as d3 from "d3";
import Control from 'ol/control/Control';

class NetworkMap extends Map {
    constructor(options) {
        // map options
        options.base = {source: 'cartodb_dark'};
        super(options);

        // network map options
        this.data = options.data || [];
        this.fontColor = options.fontColor || 'white';
        this.scale = options.scale || [
            'rgb(26, 152, 80)',
            'rgb(102, 189, 99)',
            'rgb(166, 217, 106)',
            'rgb(217, 239, 139)',
            'rgb(255, 255, 191)',
            'rgb(254, 224, 139)',
            'rgb(253, 174, 97)',
            'rgb(244, 109, 67)',
            'rgb(215, 48, 39)',
            'rgb(168, 0, 0)'
        ];

        // add network layer to map
        this._drawNetwork();

        // draw legend
        this._drawLegend(options.legend);
    }

    _drawNetwork() {
        var _this = this;

        // process flows to point to amounts
        this.amounts = [];
        this.data.forEach(function (flow) {
            // exclude zero values from scale definition
            if (flow.amount > 0) {
                _this.amounts.push(flow.amount);
            }
        })

        // define scale
        this._getScale();

        // define network color based on amount
        function assignColor(amount) {
            for (var i = 1; i < _this.values.length; i++) {
                if (amount <= _this.values[i]) {
                    return _this.scale[i - 1];
                }
            }
            return _this.scale[_this.scale.length - 1];
        }

        // create network layer
        this.addVectorLayer('network');

        // create flows layer
        this.addVectorLayer('flows');

        // add ways to map and load with amounts
        this.data.forEach(function (flow) {
            var layer = amount ? 'flows' : 'network',
                geometry = flow.geometry,
                amount = flow.amount;
            _this.addFeature(layer, geometry, {
                style: {
                    // color, width & zIndex based on amount
                    stroke:  {
                        color: amount > 0 ? assignColor(amount) : _this.fontColor,
                        width: amount > 0 ? 2 * (1 + 2 * amount / _this.max) : 0.5,
                    },
                    zIndex: amount,
                },
                tooltip: amount
            });
        });

        // focus on network layer
        this.focusOnLayer('network');
    }

     _getScale() {
        var _this = this;

        // scale of equal frequency intervals
        this.max = Math.max(...this.amounts);
        var quantile = d3.scaleQuantile()
                         .domain(this.amounts)
                         .range(this.scale);

        // prettify scale intervals
        function prettify(val) {
            if (val < 1) return val.toFixed(2);
            var int = ~~(val),
                digits = int.toString().length - 1,
                base = 10 ** digits;
            return Math.round(val / base) * base;
        }

        this.values = [];
        Object.values(quantile.quantiles()).forEach(function (val) {
            _this.values.push(prettify(val));
        });
        this.values.unshift(0);
        this.values.push(prettify(this.max));
    }

    _drawLegend(options) {
        options = options || {};
        var fontSize = 15;

        // legend div
        var legend = document.getElementById('legend');
        if (legend) legend.parentElement.removeChild(legend);
        legend = document.createElement('div');

        // default legend style
        legend.style.position = 'relative';
        legend.style.margin = 'auto';
        legend.style.marginTop = '85vh';
        legend.style.backgroundColor = 'transparent';
        legend.style.color = 'white';
        console.log(legend.style)

        // load custom style
        Object.entries(options).forEach(function(pair) {
            var [key, value] = pair;
            legend.style[key] = value;
        })
        var width = options.width || 400,
            height = options.height || 30;
        var rectWidth = width / this.scale.length;
        legend.style.width = `${width}px`;

        // create OpenLayers control for legend
        legend.className = 'ol-control-panel ol-unselectable ol-control';
        legend.id = 'legend';
        var controlPanel = new Control({
            element: legend
        });
        this.map.addControl(controlPanel);

        // legend title
        var title = document.createElement('div');
        title.style.textAlign = "center";
        title.innerHTML = '<span>Legend</span>';
        legend.appendChild(title);

        // add color scale to legend
        var scale = d3.select("#legend")
                      .append("center")
                      .append("svg")
                      .attr("width", width)
                      .attr("height", height + 10 + fontSize),
            rects = scale.selectAll('rect')
                         .data(this.scale)
                         .enter()
                         .append("rect")
                         .attr("x", function (d, i) {
                            return i * rectWidth;
                         })
                         .attr("y", 10)
                         .attr("width", rectWidth)
                         .attr("height", height)
                         .attr("fill", function (d) {
                            return d;
                         })
//            texts = scale.selectAll('text')
//                         .data(this.values)
//                         .enter()
//                         .append('text')
//                         .text(function (d) {
//                            return d >= 1000 ? `${(d/1000)}k` : `${d}`;
//                         })
//                         .attr("x", function (d, i) {
//                            return i * rectWidth;
//                         })
//                         .attr('y', height + 10 + fontSize)
//                         .attr('fill', 'white')
//                         .attr('font-size', fontSize);
    }
}

export default NetworkMap;