import GeofluxusMap from '../geofluxus-map'
import data from '../data/data'
import areas from '../data/areas'

// define tooltip, hover style
var tooltipStyle = {
        backgroundColor: 'rgba(255, 255, 0, 1)',
        fontFamily: 'MedievalSharp',
        border: 'solid',
        fontSize: '30px',
    },
    hoverStyle = {
        stroke: {
            color: 'rgba(255, 0, 0)',
            width: 6
        },
        fill: {
            color: 'rgba(255, 0, 0, 0.6)',
        }
    }

// initialize map
const map = new GeofluxusMap({
    target: 'root',
    enableZoom: true,
    enableDrag: true,
    view: {
        center: [5, 52],
        zoom: 9
    },
    base: {
        source: 'cartodb_light'
    },
    hover: {
        tooltip: {
            style: tooltipStyle
        },
        style: hoverStyle
    }
})

// define POLYGON vector layer 'areas'
// provide global feature style
var areaStyle = {
    stroke: {
        color: 'rgba(255, 255, 255)',
        width: 2
    },
    fill: {
        color: 'rgba(0, 0, 0, 0.2)'
    },
    zIndex: 1000
}
map.addVectorLayer('areas', {
    style: areaStyle
});

// add features to 'areas'
areas.features.forEach(function(area) {
    var geometry = area.geometry,
        name = area.properties.name;
    map.addFeature('areas', geometry, {
        tooltip: name
    });
})

// focus on 'areas'
map.focusOnLayer('areas');

// define MULTILINESTRING vector layer 'network'
map.addVectorLayer('network', {
    style: {
        zIndex: 2000
    }
});

// add features to 'network'
// provide individual feature style
data.forEach(function(flow) {
    var geometry = flow.geometry,
        amount = flow.amount;
    map.addFeature('network', geometry, {
        style: {
            stroke: {
                color: `rgb(${Math.floor((Math.random()*255) + 1)},
                ${Math.floor((Math.random()*255) + 1)},
                ${Math.floor((Math.random()*255) + 1)})`,
                width: 5
            }
        },
        tooltip: amount
    });
})

// focus on 'network'
map.focusOnLayer('network');