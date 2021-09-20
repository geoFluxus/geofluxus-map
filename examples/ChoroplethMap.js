import {ChoroplethMap} from '../index.js'
import data from '../data/choroplethData.js'

// new ColorBrewer scale (https://colorbrewer2.org)
var scale = [
    'rgb(158,1,66)',
    'rgb(213,62,79)',
    'rgb(244,109,67)',
    'rgb(253,174,97)',
    'rgb(254,224,139)',
    'rgb(230,245,152)',
    'rgb(171,221,164)',
    'rgb(102,194,165)',
    'rgb(50,136,189)',
    'rgb(94,79,162)'
].reverse()


// initialize map (default options)
const map1 = new ChoroplethMap({
    target: "root1",
    data: data
})


// initialize map (customize)
const map2 = new ChoroplethMap({
    target: "root2",
    controls: {
        exportCSV: false
    },
    hover: {
        tooltip: {
            body: function(d) {
                return `
                <span>${d.get('amount')} tn waste</span>
                `;
            }
        }
    },
    data: data,
    scale: scale,
    legend: {
        title: '<span style="font-size: 20px;">Waste (tonnes)</span>',
        width: 600,
        height: 20,
        borderRadius: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        bottom: '1em',
        paddingBottom: '10px',
        fontSize: 15,
    }
})