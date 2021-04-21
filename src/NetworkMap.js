import Map from './Map';
import * as d3 from "d3";
import Control from 'ol/control/Control';


export default class NetworkMap extends Map {
    constructor(options) {
        // map options
        options.base = options.base || {source: 'cartodb_dark'};
        options.hover = options.hover || {
            style: {
                stroke: {
                    width: 10
                },
                zIndex: 9999
            },
            tooltip: {
                style: {
                    color: 'white'
                }
            }
        };
        super(options);

        // network map controls
        var controls = options.controls || {},
            toggleNetwork = controls.toggleNetwork != undefined ? controls.toggleNetwork : true,
            toggleLegend = controls.toggleLegend != undefined ? controls.toggleLegend : true,
            toggleLight = controls.toggleLight != undefined ? controls.toggleLight : true;
        if (toggleNetwork) this.map.addControl(new ToggleNetwork({target: this}));
        if (toggleLegend) this.map.addControl(new ToggleLegend({target: this}));
        if (toggleLight) this.map.addControl(new ToggleLight({target: this}));

        // network map options
        this.data = options.data || [];
        this.defaultColor = options.defaultColor || 'white';
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
            var amount = flow.amount,
                layer = amount ? 'flows' : 'network',
                geometry = flow.geometry;

            function getTooltip(d) {
                var format = d3.format(".3"),
                    prefix = d3.format(".3s");
                return amount < 1e3 ? format(d) : prefix(d);
            }

            _this.addFeature(layer, geometry, {
                style: {
                    // color, width & zIndex based on amount
                    stroke:  {
                        color: amount > 0 ? assignColor(amount) : _this.defaultColor,
                        width: amount > 0 ? 2 * (1 + 2 * amount / _this.max) : 0.5,
                    },
                    zIndex: amount,
                },
                tooltip: getTooltip(amount)
            });
        });

        // focus on network layer
        this.focusOnLayer('flows');
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
            if (val < 1) return parseFloat(val.toFixed(2));
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
        var _this = this;

        // legend div
        if (this.legend != undefined) this.legend.remove();
        this.legend = document.createElement('div');

        // default legend style
        this.legend.style.left = "0";
        this.legend.style.right = "0";
        this.legend.style.margin = "auto";
        this.legend.style.bottom = '0';
        this.legend.style.backgroundColor = 'transparent';
        this.legend.style.color = 'white';

        // load custom style
        Object.entries(options).forEach(function(pair) {
            var [key, value] = pair;
            _this.legend.style[key] = value;
        })
        var width = options.width || 500,
            height = options.height || 20;
        var rectWidth = width / this.scale.length;
        this.legend.style.width = `${width + rectWidth * 1.1}px`;
        var fontSize = options.fontSize || 10;

        // create OpenLayers control for legend
        this.legend.className = 'ol-control-panel ol-unselectable ol-control';
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
        title.innerHTML = options.title || '<span>Legend</span>';
        this.legend.appendChild(title);

        // legend palette
        var palette = document.createElement('div');
        palette.id = "legend-palette";
        this.legend.appendChild(palette);

        var rectSVG = d3.select("#legend-palette")
                        .append("svg")
                        .attr("width", width + rectWidth)
                        .attr("height", height),
            rects = rectSVG.selectAll('rect')
                         .data(this.scale)
                         .enter()
                         .append("rect")
                         .attr("x", function (d, i) {
                            return (i+0.45) * rectWidth;
                         })
                         .attr("width", rectWidth)
                         .attr("height", height)
                         .attr("fill", function (d) {
                            return d;
                         });

        // legend axis
        var axis = document.createElement('div');
        axis.id = "legend-axis";
        this.legend.appendChild(axis);

        var textSVG = d3.select("#legend-axis")
                        .append("svg")
                        .attr("width", width + rectWidth * 1.1)
                        .attr("height", height),
            texts = textSVG.selectAll('text')
                         .data(this.values)
                         .enter()
                         .append('text')
                         .text(function (d) {
                            var prefix = d3.format("~s");
                            return d < 1 ? d : prefix(d);
                         })
                         .attr("x", function (d, i) {
                            return (i+0.45) * rectWidth;
                         })
                         .attr('y', fontSize)
                         .attr('fill', this.legend.style.color)
                         .attr('font-size', fontSize);
    }
}


// toggle network control
class ToggleNetwork extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<span>N</span>';
        button.className = 'ol-toggle-network';
        button.title = "Toggle network"

        const element = document.createElement('div');
        element.className = 'ol-toggle-network ol-unselectable ol-control';
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
        this.target.setVisible('network', this.visible);
        this.visible = !this.visible;
    }
}


// toggle legend control
class ToggleLegend extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<span>L</span>';
        button.className = 'ol-toggle-legend';
        button.title = "Toggle legend"

        const element = document.createElement('div');
        element.className = 'ol-toggle-legend ol-unselectable ol-control';
        element.style.top = '12em';
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
        button.innerHTML = '<span>D</span>';
        button.className = 'ol-toggle-light';
        button.title = "Toggle light"

        const element = document.createElement('div');
        element.className = 'ol-toggle-light ol-unselectable ol-control';
        element.style.top = '14.5em';
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
        var base = this.target.base,
            legend = this.target.legend;

        // change map base layer
        base.source = base.source == 'cartodb_dark' ? 'cartodb_light' : 'cartodb_dark';
        this.target.changeBase(base);

        // change legend font color
        var color = legend.style.color == 'white' ? 'black' : 'white';
        this.target._drawLegend({color: color});

        // change network color
        var networkLayer = this.target._getLayer('network'),
            features = networkLayer.getSource().getFeatures();
        features.forEach(function(feature) {
            networkLayer.getSource().removeFeature(feature); // remove feature from layer
            feature.getStyle().getStroke().setColor(color); // change feature color
        })
        networkLayer.getSource().addFeatures(features); // add features back to layer
    }
}