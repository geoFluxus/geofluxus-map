import {FlowMap} from '../index.js'
import flows from '../data/flows'

//var data = []
//for (var i=0; i < 50; i++) {
//    var offLon = Math.floor((Math.random()*100) + 1) * 0.1,
//        offLat = Math.floor((Math.random()*100) + 1) * 0.1;
//    flows.forEach(function(f) {
//        var add = JSON.parse(JSON.stringify(f));
//        add.source.lon += offLon;
//        add.source.lat -= offLat;
////        add.processgroup += more;
//        data.push(add)
//    })
//}
//console.log(data.length)

var scale = {
    'Storage': 'rgb(27,158,119)',
    'Physical processing': 'rgb(217,95,2)',
    'Chemical processing': 'rgb(117,112,179)',
    'Incineration': 'rgb(231,41,138)',
    'Recycling': 'rgb(102,166,30)'
};

const map1 = new FlowMap({
    target: "root1",
    data: flows,
    base: {source: 'cartodb_light'},
    animate: 0,
//    controls: {
//        zoom: false
//    },
//    scale: scale,
    groupBy: 'processgroup',
    legend: {
        title: "<span><b>Process groups</b></span>",
//        overflow: 'hidden',
//        height: '200px',
//        overflowY: 'scroll'
    }
})


const map2 = new FlowMap({
    target: "root2",
    data: flows,
    animate: 1,
//    controls: {
//        zoom: false
//    },
//    scale: scale,
    groupBy: 'processgroup',
    legend: {
        title: "<span><b>PROCESS GROUPS</b></span>",
//        overflow: 'hidden',
//        height: '200px',
//        overflowY: 'scroll'
    },
    tooltip: {
        body: function(d) {
            return `
                <table>
                    <tbody>
                        <tr>
                            <td>Process group: </td>
                            <td>${d.processgroup}</td>
                        </tr>
                        <tr>
                            <td>From: </td>
                            <td>${d.source.name}</td>
                        </tr>
                        <tr>
                            <td>To: </td>
                            <td>${d.target.name }</td>
                        </tr>
                        <tr>
                            <td>Amount: </td>
                            <td>${d.amount.toFixed(2)} tonnes</td>
                        </tr>
                    </tbody>
                </table>
            `;
        },
        style: {
            padding: '15px'
        }
    }
})