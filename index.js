import GeofluxusMap from './geofluxus-map.js'
import data from './data.js'
import areas from './areas.js'


//var tooltipStyle = {
//        backgroundColor: 'rgba(255, 255, 0, 1)',
//        fontFamily: 'MedievalSharp',
//        border: 'solid',
//        fontSize: '30px',
//    },
//    hoverStyle = {
//        stroke: {
//            color: 'rgba(255, 0, 0)',
//            width: 6
//        },
//        fill: {
//            color: 'rgba(255, 0, 0, 0.6)',
//        },
//        zIndex: 9999
//    }
//
const map = new GeofluxusMap({
    target: 'map',
    enableZoom: true,
    enableDrag: true,
    view: {
        center: [5, 52],
        zoom: 9
    },
    base: {
        source: 'osm'
    },
//    hover: {
//        tooltip: {
//            style: tooltipStyle
//        },
//        style: hoverStyle
//    }
})
////
//map.addVectorLayer('areas');
//areas.features.forEach(function(area) {
//    var geometry = area.geometry,
//        name = area.properties.name;
//    map.addFeature('areas', geometry, {
//        tooltip: name
//    });
//})
//map.focusOnLayer('areas');

//var style = {
//    stroke: {
//        width: 5,
//        color: 'rgb(100, 100, 100)'
//    },
//    zIndex: 1000
//}
//
//// initialize map
//const map = new GeofluxusMap({
//    // HTML element to render map,
//    target: 'map',
//    // map view: center, zoom etc.
////    view: {
////        center: [6, 52],
////        //zoom: 10,
////        minZoom: 7,
////        maxZoom: 10
////    },
//    // map background
//    base: {
//        source: 'cartodb_light'
//    },
//    // enable zoom (drag) with mouse / keyboard
//    // default allows zoom (drag) only with map controls
//    enableZoom: true,
//    enableDrag: true,
//    hover: {
//        tooltip: {
//            style: {
////                display: 'none',
//                backgroundColor: 'rgb(255, 255, 0)',
//                fontFamily: 'MedievalSharp',
//                borderStyle: 'dotted',
//                fontSize: '20px'
//            }
//        },
//        style: {
//            stroke: {
//                color: 'rgb(255, 255, 0)',
//                width: 2
//            },
//            fill: {
//                color: 'rgba(255, 0, 0, 0.6)'
//            }
//        }
//    }
//});
//
//var areaStyle = {
//    stroke: {
//        color: 'rgba(255, 255, 255)',
//        width: 2
//    },
//    fill: {
//        color: 'rgba(0, 0, 0, 0.2)'
//    },
//    zIndex: 2000
//}
//map.addVectorLayer('areas', {
////    style: areaStyle
//});
////
////
//areas.features.forEach(function(area) {
//    var geometry = area.geometry,
//        name = area.properties.name;
//    map.addFeature('areas', geometry, {
//        tooltip: name,
//        label: name // TODO: add labels
//    });
//})
//
//map.focusOnLayer('areas')

// add data layer
// layer name is mandatory!
// each layer supports only one geometry type
//map.addVectorLayer('network', {
////    style: style
//});

// focus on layer extent
// layer has no features yet, focus on map center
//map.focusOnLayer('network');

// add data
//data.forEach(function(flow) {
//    var geometry = flow.geometry;
//    map.addFeature('network', geometry, {
//        style: {
//            stroke: {
//                color: `rgb(${Math.floor((Math.random()*255) + 1)},
//                ${Math.floor((Math.random()*255) + 1)},
//                ${Math.floor((Math.random()*255) + 1)})`,
//                width: 5
//            }
//        }
//    });
//})

//// focus on layer extent
//map.focusOnLayer('network');