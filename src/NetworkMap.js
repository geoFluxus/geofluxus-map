import Map from './Map';
import * as d3 from "d3";
import Control from 'ol/control/Control';

class NetworkMap extends Map {
    constructor(options) {
        super(options);

        this.data = options.data || [];
        this.fontColor = "white";

        // define colors
        this.colors = [
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
        ]

        // add network layer to map
        this._drawNetwork();
    }

    _drawNetwork() {
        var _this = this;

        // convert tonnes to other units if necessary
        var max = Math.max.apply(Math, this.data.map(function(o) { return o.amount; })),
            multiplier = 1;
        if (max <= 10**(-3)) {
            multiplier = 10**6;
            this.unit = 'gr';
        } else if (max <= 1) {
            multiplier = 10**3;
            this.unit = 'kg';
        }

        if (multiplier != 1) {
            this.flows.forEach(function(f) {
                f.amount *= multiplier;
            })
        }

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
                    return _this.colors[i - 1];
                }
            }
            return _this.colors[_this.colors.length - 1];
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
//                tooltip: _this.getTooltipText(amount)
            });
        });

        // focus on network layer
        this.focusOnLayer('network');

        // define legend
        this._drawLegend();
    }

     _getScale() {
        var _this = this;

        // scale of equal frequency intervals
        this.max = Math.max(...this.amounts);
        var quantile = d3.scaleQuantile()
                         .domain(this.amounts)
                         .range(this.colors);

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

    _drawLegend() {
        var _this = this;

        var legend = document.getElementById('networkmap-legend');
        if (legend) {
            legend.parentElement.removeChild(legend);
        }
        var legend = document.createElement('div');
        legend.className = 'ol-control-panel ol-unselectable ol-control';
        legend.id = 'networkmap-legend';
        var controlPanel = new Control({
            element: legend
        });
        this.map.addControl(controlPanel);

        var title = document.createElement('div');
        title.style.textAlign = "center";
        title.innerHTML = '<span style="color: ' + this.fontColor + '; text-align: center;">' + 'Legend' + '</span>';
        legend.appendChild(title);

        // add color scale to legend
        var width = 30,
            height = 30;
        var scale = d3.select("#networkmap-legend")
            .append("center")
            .append("svg")
            .attr("width", width * (this.colors.length))
            .attr("height", 100),
            rects = scale.selectAll('rect')
            .data(this.colors)
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return i * width;
            })
            .attr("y", 10)
            .attr("width", 30)
            .attr("height", 30)
            .attr("fill", function (d) {
                return d;
            }),
            texts = scale.selectAll('text')
            .data(this.values)
            .enter()
            .append('text')
            .text(function (d) {
                return d >= 1000 ? `${(d/1000)}k` : `${d}`;
            })
            .attr("x", function (d, i) {
                return i * (width - 1);
            })
            .attr('y', 2 * height)
            .attr('fill', _this.fontColor)
            .attr('font-size', 10);
    }
}

export default NetworkMap;