import Map from '../src/Map'
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
        },
        zIndex: 9999
    }

// initialize map
const map = new Map({
    target: 'root',
    controls: {
        drag: false
    },
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
    },
    reset: true
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