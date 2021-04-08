import GeofluxusMap from './geofluxus-map.js'
import data from './data.js'

var style = {
    stroke: {
        width: 5,
        color: 'rgb(100, 100, 100)'
    },
    zIndex: 1000
}

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
map.addVectorLayer('network', {
    style: style
});

// add data
data.forEach(function(flow) {
    var geometry = flow.geometry;
    map.addFeature('network', geometry, {
        style: {
            stroke: {
                width: 1
            }
        }
    });
})

map.focusOnLayer('network');