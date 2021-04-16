import NetworkMap from '../src/NetworkMap'
import data from '../data/data'

var hoverStyle = {};

var scale = ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'].reverse()

//data.forEach(function(d) {
//    return d.amount *= 1e-3;
//})

// initialize map
const map = new NetworkMap({
    target: "root",
//    view: {
//        minZoom: 7,
//        maxZoom: 10
//    },
//    base: {
//        source: 'cartodb_light',
//    },
    data: data,
//    defaultColor: 'blue',
//    scale: scale,
//    hover: {
//        style: hoverStyle
//    },
    legend: {
//        title: '<span>CO<sub>2</sub> (kg)</span>',
//        width: 700,
//        height: 30,
//        marginLeft: '1vw',
//        marginTop: '85vh',
//        borderRadius: '1rem',
//        backgroundColor: 'rgba(255, 255, 255, 0.2)',
//        paddingBottom: '10px',
//        color: 'black',
//        fontSize: 15,
    }
})