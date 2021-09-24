import {MapChart} from '../index.js'
import data from '../data/choroplethData.js'

// add categories
data.forEach(function(d) {
    d['type'] = d.amount >= 0 ? d.amount ? 'increase' : 'stagnation' : 'decrease'
})

// custom scale
var scale = {
    'decrease': 'rgb(117,112,179)',
    'increase': 'rgb(27,158,119)',
    'stagnation': 'rgb(217,95,2)',
};

// initialize map (default options)
const map1 = new MapChart({
    target: "root1",
    data: data,
    groupBy: 'type'
})

// initialize map (custom options)
const map2 = new MapChart({
    target: "root2",
    data: data,
    groupBy: 'type',
    scale: scale,
    hover: {
        tooltip: {
            body: function(d) {
                return `
                <span>${d.get('amount')} tn waste</span>
                `;
            }
        }
    },
    legend: {
        title: '<span>Waste (tonnes)</span>',
        borderRadius: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        bottom: '1em',
        right: '1em'
    }
})