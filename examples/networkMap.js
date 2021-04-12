import NetworkMap from '../src/NetworkMap'
import data from '../data/data'

// initialize map
const map = new NetworkMap({
    target: "root",
    base: {
        source: 'cartodb_dark'
    },
    enableDrag: true,
    enableZoom: true,
    data: data
})