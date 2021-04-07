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
    background: {
        source: 'osm'
    }
});


// add data layer
// layer name is mandatory!
// each layer supports only one geometry type
map.addVectorLayer('network');

data.forEach(function(flow) {
    var geometry = flow.geometry;
    map.addGeometry('network', geometry);
})