import GeofluxusMap from './geofluxus-map.js'
import data from './data.js'


// initialize map
const map = new GeofluxusMap({
    // HTML element to render map,
    target: 'map',
    // map view: center, zoom etc.
    view: {
        center: [6, 52],
        zoom: 10
    },
    // map background
    base: {
        source: 'cartodb_light'
    }
});


// add data layer
// layer name is mandatory!
// each layer supports only one geometry type
var style = {
    stroke: {
        width: 5,
        color: 'rgb(100, 100, 100)'
    },
    zIndex: 1000
}
map.addVectorLayer('network', {
    style: style
});

// add data
data.slice(0, 1).forEach(function(flow) {
    var geometry = flow.geometry;
    map.addGeometry('network', geometry, {
        style: {
            stroke: {
                width: 100
            }
        }
    });
})