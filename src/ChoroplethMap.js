import NetworkMap from "./NetworkMap";
import Control from 'ol/control/Control';
import { _default } from './utils.js'

export default class ChoroplethMap extends NetworkMap {
    constructor(options) {

        // hover
        options.hover = _default(options.hover, {
            style: {
                stroke: {
                    width: 1
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

        // ChoroplethMap controls
        options.controls = _default(options.controls, {
            toggleNetwork: false,
            toggleLegend: true,
            toggleTransparency: true,   // new control
            toggleLight: true,
            exportCSV: false,
        });  
        options.controlClasses = {
            toggleTransparency: ToggleTransparency,
        }  

        // color scale (https://colorbrewer2.org/#type=sequential&scheme=PuBuGn&n=5)
        // sequential scale
        options.transparency = 1.0;

        options.scale = options.scale || [
            `rgba(246,239,247,${options.transparency})`,
            'rgb(189,201,225)',
            'rgb(103,169,207)',
            'rgb(28,144,153)',
            'rgb(1,108,89)'
        ];

        // initialize map
        super(options);
        console.log(options.transparency)
    }

    // overrides original method to work with shapes with fill
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

        // define fill color based on amount
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

        // add areas to map and load with amounts
        this.data.forEach(function (flow) {
            // primary properties
            var amount = flow.amount,
                layer = amount ? 'flows' : 'network',
                geometry = flow.geometry;

            // secondary properties
            var props = {amount: amount.toFixed(2)}
            Object.keys(flow).forEach(function(key) {
                if (!['amount', 'geometry'].includes(key)) props[key] = flow[key];
            })

            _this.addFeature(layer, geometry, {
                style: {
                    // color, width & zIndex based on amount
                    stroke:  {
                        color: 'black',
                        width: 0.5,
                    },
                    fill: {color: amount > 0 ? assignColor(amount) : _this.defaultColor},
                    zIndex: amount,
                },
                props: props
            });
        });

        // focus on network layer
        this.focusOnLayer('flows');
    }
}

// toggle transparency
class ToggleTransparency extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-fill-drip"></i>';
        button.className = 'ol-toggle-transparency';
        button.title = "Toggle Transparency"

        const element = document.createElement('div');
        element.className = 'ol-toggle-transparency ol-unselectable ol-control';
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target ChoroplethMap
        this.target = options.target;

        button.addEventListener('click', this.toggleTransparency.bind(this), false);
    }

    toggleTransparency() {
        console.log('Changing transparency...')

        // change network color
        var networkLayer = this.target._getLayer('network'),
            features = networkLayer.getSource().getFeatures();
        features.forEach(function(feature) {
            networkLayer.getSource().removeFeature(feature); // remove feature from layer

            var color = feature.getStyle().getFill().getColor();
            feature.getStyle().getFill().setColor(color);    // change feature fill
        })
        networkLayer.getSource().addFeatures(features);      // add features back to layer
    }
}