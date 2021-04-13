import NetworkMap from '../src/NetworkMap'
import data from '../data/data'

var hoverStyle = {
        stroke: {
            width: 10
        },
        zIndex: 9999
    }

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

// initialize map
const map = new NetworkMap({
    target: "root",
    enableDrag: true,
    enableZoom: true,
    data: data,
    scale: scale,
    hover: {
        style: hoverStyle
    },
    legend: {
//        width: 500,
//        height: 30,
//        marginLeft: '5vw',
//        marginTop: '80vh',
//        borderRadius: '1rem',
//        backgroundColor: 'white',
//        opacity: 0.8,
//        padding: '20px',
//        color: 'black'
    }
})