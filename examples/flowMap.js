import {FlowMap} from '../index.js'
import flows from '../data/flows'


const map = new FlowMap({
    target: "root",
    data: flows,
    colorBy: 'processgroup'
})