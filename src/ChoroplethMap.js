import NetworkMap from "./NetworkMap";
import * as d3 from "d3";
import Control from 'ol/control/Control';
import saveAs from 'file-saver';
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

        // NetworkMap controls
        options.controls = _default(options.controls, {
            toggleNetwork: false,
            toggleLegend: true,
            toggleLight: true,
            exportCSV: false,
        });        

        // color scale (https://colorbrewer2.org/#type=sequential&scheme=PuBuGn&n=5)
        // sequential scale
        options.scale = options.scale || [
            'rgb(246,239,247)',
            'rgb(189,201,225)',
            'rgb(103,169,207)',
            'rgb(28,144,153)',
            'rgb(1,108,89)'
        ];

        // initialize map
        super(options);
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