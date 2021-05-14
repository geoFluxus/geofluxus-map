import {FlowMap} from '../index.js'
import flows from '../data/flows'

// custom scale
var scale = {
    'Storage': 'rgb(27,158,119)',
    'Physical processing': 'rgb(217,95,2)',
    'Chemical processing': 'rgb(117,112,179)',
    'Incineration': 'rgb(231,41,138)',
    'Recycling': 'rgb(102,166,30)'
};

// flow map (default options)
const map1 = new FlowMap({
    target: "root1",
    data: flows,
    groupBy: 'processgroup',
})


// flow map (customize)
const map2 = new FlowMap({
    target: "root2",
    data: flows,
    animate: 1,
    groupBy: 'processgroup',
    legend: {
        title: "<span><b>Process groups</b></span>",
    },
    tooltip: {
        body: function(d) {
            if (d.source) {
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
            }
            return `
                <table>
                    <tbody>
                        <tr>
                            <td>Name: </td>
                            <td>${d.name}</td>
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