import GeofluxusMap from './geofluxus-map.js'

const map = new GeofluxusMap({
    // HTML element to render map,
    target: 'map',
    // map view: center, zoom etc.
    view: {
        center: [6, 52],
        zoom: 10
    },
    // map background
    background: {
        source: 'cartodb_light'
    }
});