import {FlowMap} from '../index.js'
import flows from '../data/flows'

//var data = []
//for (var i=0; i < 10; i++) {
//    var offLon = Math.floor((Math.random()*100) + 1) * 0.1,
//        offLat = Math.floor((Math.random()*100) + 1) * 0.1,
//        more = Math.floor((Math.random()*100) + 1) * 0.1;
//    flows.forEach(function(f) {
//        var add = JSON.parse(JSON.stringify(f));
//        add.source.lon += offLon;
//        add.source.lat -= offLat;
//        add.processgroup += more;
//        data.push(add)
//    })
//}
//console.log(data)

var scale = {
    'Storage': 'rgb(27,158,119)',
    'Physical processing': 'rgb(217,95,2)',
    'Chemical processing': 'rgb(117,112,179)',
    'Incineration': 'rgb(231,41,138)',
    'Recycling': 'rgb(102,166,30)'
};

const map = new FlowMap({
    target: "root",
    data: flows,
//    scale: scale,
    groupBy: 'processgroup'
})