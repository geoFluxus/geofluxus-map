import {FlowMap} from '../index.js'
import flows from '../data/flows'

//var data = []
//for (var i=0; i < 10000; i++) {
//    var off = i * 0.1;
//    flows.forEach(function(f) {
//        var add = JSON.parse(JSON.stringify(f));
//        add.source.lon += off;
//        data.push(add)
//    })
//}
//console.log(data.length)

const map = new FlowMap({
    target: "root",
    data: flows,
    colorBy: 'processgroup'
})