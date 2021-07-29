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

        options.scale = options.scale || [
            'rgba(246,239,247,1)',
            'rgba(189,201,225,1)',
            'rgba(103,169,207,1)',
            'rgba(28,144,153,1)',
            'rgba(1,108,89,1)'
        ];

        // initialize map
        super(options);
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
        button.title = "Transparency (on/off)"

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
        const transparency = 0.6;   // set transparency value

        // change network color
        var flowsLayer = this.target._getLayer('flows'),
            features = flowsLayer.getSource().getFeatures();

        features.forEach(function(feature){
            var color = feature.getStyle().getFill().getColor()
            
            // check if color in Hex 
            var RegExp = /^#([0-9A-F]{6}|[0-9A-F]{8})$/i;
            const testHex = RegExp.test(color) == true ? true : false ;

            // check if color in RGBA
            var RegExp = /^rgb/i;
            const testRGB = RegExp.test(color) == true ? true : false ;
            
            if (!testHex && testRGB) {
                var rgba = color.match(/\d+/g);                                        // extract RGB(A) data
                if (rgba.length == 4) {
                    color = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${transparency})`;  // add alpha channel to RGB code
                } else {
                    var alpha = rgba[3] == 1 ? transparency : 1 ;                      // change transparency value
                    color = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${alpha})`;         // recreate color
                }

            } else if (testHex && !testRGB) {
                var alpha = (transparency * 255).toString(16);  // convert transparency to HEX
                if (color.length == 7) {                                                
                    color = color.replace('#',`#${alpha}`);     // prepend transparency value to HEX color                    
                } else { 
                    var preAlpha = color.substring(1,3);
                    var postAlpha = preAlpha == alpha ? '' : alpha ;  // change transparency value
                    color = '#' + postAlpha + color.substring(3);   // recrete HEX color with new transparancy values
                }

            } else { console.log('The color must be either in RGBA or HEX format...')}  // currently the system only allows for RGBA or HEX formats...

            flowsLayer.getSource().removeFeature(feature);  // remove feature from layer
            feature.getStyle().getFill().setColor(color);   // change feature fill
        })
        flowsLayer.getSource().addFeatures(features);       // add features back to layer
    }
}