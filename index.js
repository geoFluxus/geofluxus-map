import GeofluxusMap from './geofluxus-map.js'
import data from './data.js'
import areas from './areas.js'


// initialize map
const map = new GeofluxusMap({
    // HTML element to render map,
    target: 'map',
    // map view: center, zoom etc.
    view: {
        center: [6, 52],
        //zoom: 10,
        minZoom: 7,
        maxZoom: 10
    },
    // map background
    base: {
        source: 'cartodb_light'
    },
    // enable zoom (drag) with mouse / keyboard
    // default allows zoom (drag) only with map controls
    //enableZoom: true,
    enableDrag: true,
});

var areaStyle = {
    stroke: {
        color: 'rgba(255, 0, 0)',
        width: 2
    },
    fill: {
        color: 'rgba(0, 0, 255)'
    },
    zIndex: 500
}
map.addVectorLayer('areas', {
    style: areaStyle
});
areas.features.forEach(function(area) {
    var geometry = area.geometry;
    map.addFeature('areas', geometry);
})

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

// focus on layer extent
// layer has no features yet, focus on map center
map.focusOnLayer('network');

// add data
data.forEach(function(flow) {
    var geometry = flow.geometry;
    map.addFeature('network', geometry, {
        style: {
            stroke: {
                color: `rgb(${Math.floor((Math.random()*255) + 1)},
                ${Math.floor((Math.random()*255) + 1)},
                ${Math.floor((Math.random()*255) + 1)})`
            }
        }
    });
})

// focus on layer extent
map.focusOnLayer('network');