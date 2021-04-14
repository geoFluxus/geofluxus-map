import NetworkMap from '../src/NetworkMap'
import data from '../data/data'

var hoverStyle = {};

var scale = [
    'rgb(165,0,38)',
    'rgb(215,48,39)',
    'rgb(244,109,67)',
    'rgb(253,174,97)',
    'rgb(254,224,144)',
    'rgb(224,243,248)',
    'rgb(171,217,233)',
    'rgb(116,173,209)',
    'rgb(69,117,180)',
    'rgb(49,54,149)'
].reverse()

//data.forEach(function(d) {
//    return d.amount *= 1e-3;
//})

// initialize map
const map = new NetworkMap({
    target: "root",
//    base: {
//        source: 'cartodb_light',
//    },
//    enableDrag: true,
//    enableZoom: true,
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
//        marginRight: '1vw',
//        marginTop: '80vh',
//        borderRadius: '1rem',
//        backgroundColor: 'white',
//        opacity: 0.8,
//        padding: '20px',
//        color: 'black',
//        fontSize: 20,
    }
})

map.setVisible('network', false);
map.setVisible('network', true);