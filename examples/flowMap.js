import {FlowMap} from '../index.js'
import flows from '../data/flows'

//var data = []
//for (var i=0; i < 1000; i++) {
//    var offLon = Math.floor((Math.random()*100) + 1) * 0.1,
//        offLat = Math.floor((Math.random()*100) + 1) * 0.1;
//    flows.forEach(function(f) {
//        var add = JSON.parse(JSON.stringify(f));
//        add.source.lon += offLon;
//        add.source.lat -= offLat;
//        data.push(add)
//    })
//}
//console.log(data.length)

var scale = {
    '22': 'rgb(27,158,119)',
    '23': 'rgb(217,95,2)',
    '24': 'rgb(117,112,179)',
    '26': 'rgb(231,41,138)',
    '27': 'rgb(102,166,30)'
};

const map = new FlowMap({
    target: "root",
    data: flows,
    scale: scale,
    groupBy: 'processgroup'
})