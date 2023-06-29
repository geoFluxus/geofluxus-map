import Map from "./Map"
import { _default } from './utils.js'
import Control from 'ol/control/Control';
import * as d3 from 'd3';


export default class MapChart extends Map {
    constructor(options) {
        // base layer
        options.base = _default(options.base, {
            source: 'mapbox_dark'
        });

        // hover
        options.hover = _default(options.hover, {
            style: {
                stroke: {
                    width: 2
                },
                zIndex: 9999
            },
            tooltip: {
                body: function(d) {
                    return `
                        <span>${d.get('amount')}</span>
                        `;
                },
                style: {
                    color: 'white',
                    textAlign: 'center',
                    padding: '0.5em',
                    fontSize: '15px',
                    backgroundColor: 'rgba(139, 138, 138, 1)',
                    borderRadius: '1.5rem'
                },
            }
        });

        // NetworkMap controls
        options.controls = _default(options.controls, {
            toggleLegend: true,
            toggleLight: true
        });
        options.controlClasses = _default(options.controlClasses, {
            toggleLegend: ToggleLegend,
            toggleLight: ToggleLight,
        });

        // initialize map
        super(options)
        var _this = this;

        // map chart options
        this.data = JSON.parse(JSON.stringify(options.data || []));
        this.groupBy = options.groupBy;  // group flows by property

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
        // define colors based on groupby property
        this.colors = (Array.isArray(this.scale)) ? this._getColors() : this.scale;

        // change logo & button style
        this.stylizeButtons({color: 'white'});
        this.addLogo('white');

        // get areas
        this._drawAreas();

        // get legend
        this.legendOptions = options.legend || {};
        this.legendOptions.color = this.legendOptions.color || 'white';
        this._drawLegend();
    }

    _getColors() {
        var _this = this;

        this.scale = d3.interpolateRgbBasis(this.scale);

        // get unique categories
        var categories = [];
        this.data.forEach(function(d) {
            var value = d[_this.groupBy];
            if (!categories.includes(value)) categories.push(value);
        })
        categories.sort();

        // interpolate
        var colors = {};
        for (var i = 0; i < categories.length; i++) {
            var norm = i / (categories.length - 1);
            colors[categories[i]] = this.scale(norm);
        }

        return colors;
    }

    _drawAreas() {
        var _this = this;

        // create areas layer
        this.addVectorLayer('areas');

        this.data.forEach(function(d) {
            // primary properties
            var amount = d.amount,
                geometry = d.geometry;

            // secondary properties
            var props = {amount: amount.toFixed(2)}
            Object.keys(d).forEach(function(key) {
                if (!['amount', 'geometry'].includes(key)) props[key] = d[key];
            })

            // render geometry
            _this.addFeature('areas', geometry, {
                style: {
                    // color, width & zIndex based on amount
                    stroke:  {
                        color: 'black',
                        width: 0.5,
                    },
                    fill: {
                        color: _this.colors[d[_this.groupBy]]
                    },
                    zIndex: amount,
                },
                props: props
            });
        })

        // focus on areas layer
        this.focusOnLayer('areas');
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

        // add colorboxes
        this._addColorboxes();
    }

    // add legend colorboxes
    _addColorboxes() {
        var _this = this;

        // add selectAll
        this.checkboxes = [];

        // checkboxes for groupby property
        Object.entries(this.colors).forEach(function(entry) {
            var [property, color] = entry;

            // div to host checkbox & label
            var div = document.createElement('div')
            div.style.margin = '10px'

            // checkbox wrapper
            var wrapper = document.createElement('div')
            wrapper.style.float = 'left';
            wrapper.style.backgroundColor = `${color}`
            wrapper.style.marginRight = '10px';
            wrapper.style.borderRadius = '3px';
            wrapper.style.height = '15px';
            wrapper.style.width = '15px';

            // label
            var label = document.createElement('label');
            label.innerHTML = property;
            label.style.fontSize = '15px';

            // append elements
            div.appendChild(wrapper);
            div.appendChild(label);
            _this.legend.appendChild(div);
        })
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
        base.source = base.source == 'mapbox_dark' ? 'mapbox_light' : 'mapbox_dark';
        this.target.changeBase(base);

        // change legend font color
        var color = this.target.legendOptions.color == 'white' ? 'black' : 'white';
        this.target.legendOptions.color = color;

        // change logo & button style
        this.target.stylizeButtons({color: color});
        this.target.addLogo(color);
    }
}