import NetworkMap from '../src/NetworkMap'
import data from '../data/data'

var hoverStyle = {
        stroke: {
            width: 10
        },
        zIndex: 9999
    }

// initialize map
const map = new NetworkMap({
    target: "root",
    base: {
        source: 'cartodb_dark'
    },
    enableDrag: true,
    enableZoom: true,
    data: data,
    hover: {
        style: hoverStyle
    }
})