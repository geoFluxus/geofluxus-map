import {Map} from '../index.js'
import areas from '../data/areasData'

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
    target: 'root1',
    controls: {
        //zoom: false,
        exportPNG: false,
        //fullscreen: false,
        //reset: false
    },
    view: {
        center: [5, 52],
        zoom: 5
    },
    base: {
        source: 'cartodb_dark'
    },
//    hover: {
//        tooltip: {
//            body: function(d) {
//                return `
//                <table>
//                    <tr>
//                        <th colspan="2">Provincie</th>
//                    <tr>
//                    <tr>
//                        <th>Lower: </th>
//                        <td>${d.get('name')}</td>
//                    </tr>
//                    <tr>
//                        <th>Upper: </th>
//                        <td>${d.get('capital')}</td>
//                    </tr>
//                </table>
//                `;
//            },
//            style: tooltipStyle
//        },
//        style: hoverStyle
//    },
})

map.addLogo('white');

//// define POLYGON vector layer 'areas'
//// provide global feature style
//var areaStyle = {
//    stroke: {
//        color: 'rgba(255, 255, 255, 0.5)',
//        width: 1
//    },
//    fill: {
//        color: 'rgba(0, 0, 255, 0.5)'
//    },
//    zIndex: 1000
//}
//
//var selectStyle = {
//    stroke: {
//        color: 'rgba(255, 255, 255)',
//        width: 2
//    },
//    fill: {
//        color: 'rgba(0, 0, 255)'
//    },
//    zIndex: 9999
//}
//
//map.addVectorLayer('areas', {
//    style: areaStyle,
//    select: {
//        multi: false,
//        style: selectStyle,
//        onChange: function(feat) {
//            console.log(feat)
//        }
//    }
//});
//
//// add features to 'areas'
//areas.features.forEach(function(area) {
//    var geometry = area.geometry,
//        name = area.properties.name;
//    map.addFeature('areas', geometry, {
//        props: {
//            name: name,
//            capital: name.toUpperCase()
//        }
//    });
//})
//
//// focus on 'areas'
//map.focusOnLayer('areas');
//
// stylize buttons
var buttonStyle = {
    color: 'white',
//    backgroundColor: 'rgb(0, 125, 125)',
//    borderRadius: '100%'
};
map.stylizeButtons(buttonStyle)


var pointStyle = {
    image: {
        radius: 10,
        fill: {
            color: 'rgb(255, 0, 0)'
        },
        stroke: {
            color: 'rgb(255, 255, 255)',
            width: 2
        }
    },
    text: {
    }
}
map.addVectorLayer('point', {style: pointStyle})
map.addFeature('point', {
    type: 'Point',
    coordinates: [4.9, 52.366667]
})