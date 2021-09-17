import {ChoroplethMap} from '../index.js'
import data from '../data/choroplethData.js'

// new ColorBrewer scale (https://colorbrewer2.org)
var scale = [
    '#9e0142',
    '#d53e4f',
    '#f46d43',
    '#fdae61',
    '#fee08b',
    '#e6f598',
    '#abdda4',
    '#66c2a5',
    '#3288bd',
    '#5e4fa2'
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