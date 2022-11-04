import Map from "./Map";
import { _default } from './utils.js';
import Control from 'ol/control/Control';
import { wrapText } from './utils.js';
import {transform, transformExtent} from 'ol/proj';
import Overlay from 'ol/Overlay';
import * as olExtent from 'ol/extent';


export default class RouteMap extends Map {
    constructor(options) {
        // base layer
        options.base = _default(options.base, {
            source: 'cartodb_dark'
        });

        // NetworkMap controls
        options.controls = _default(options.controls, {
            toggleLight: true
        });
        options.controlClasses = _default(options.controlClasses, {
            toggleLight: ToggleLight,
        });

        // initialize map
        super(options)
        var _this = this;

        // provide API key
        this.apiKey = options.apiKey;
        if (this.apiKey === undefined) {
            alert("Please provide API key")
        }

        // change logo & button style
        this.stylizeButtons({color: 'white'});
        this.addLogo('white');

        // address bar
        this.addressBarOptions = options.addressBar || {};
        this._drawAddressBar();

        // route bar
        this.routeBarOptions = options.routeBar || {};
        this._drawRouteBar();

//        // add click event on inputs
//        [...document.getElementsByTagName('input')].forEach((item) => {
//          item.addEventListener('click', function() {
//            _this.input = item.id;
//          })
//        })

        // draw layers
        this._addLayers();
        this.focusOnLayer([
          3.31497114423, 50.803721015,
          7.09205325687, 53.5104033474
        ]);
    }

    _addLayers() {
        var _this = this;

        // address layer
        var addressStyle = {
            image: {
                fill: {
                  color: 'red'
                },
                stroke: {
                  color: 'white',
                  width: 2
                },
            },
            text: {
                fontSize: 15,
                color: 'red',
                offsetY: 30,
                textAlign: 'center'
            },
            zIndex: 1000
        }
        _this.addVectorLayer('address', {
            style: addressStyle,
            select: {
                multi: true,
                style: {
                    image: {
                        fill: {
                            color: 'green'
                        }
                    },
                    text: {
                        color: 'green'
                    }
                },
                onChange: function(feats, select) {
                    if (feats.length > 2) {
                        alert("You can select only 2 points...")
                        select.getFeatures().pop();
                        return;
                    }
                    var inputs = [
                        document.getElementById('map-route-origin'),
                        document.getElementById('map-route-destination')
                    ]
                    inputs.forEach(i => i.value = '');
                    var coords;
                    feats.forEach(function(f, i) {
                        coords = transform(f.geometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
                        inputs[i].setAttribute('coords', `${coords[0]},${coords[1]}`);
                        inputs[i].value = f.name;
                    });
                }
            }
        });

        // route layer
        var routeStyle = {
            stroke: {
                color: 'blue',
                width: 5
            }
        }
        _this.addVectorLayer('route', {
            style: routeStyle
        });
        _this._getPopup();
    }

    _loadCustomOptions(elem, options) {
        Object.entries(options || {}).forEach(function(pair) {
            var [key, value] = pair;
            elem.style[key] = value;
        })
    }

    _getPopup() {
        var _this = this,
            target = this.map.getTargetElement(),
            div = target.querySelector('.ol-popup');
        if (!div) {
            div = document.createElement('div');
            div.classList.add('ol-popup');
            target.appendChild(div);
        }
        var popup = new Overlay({
            element: div,
            offset: [10, 0],
            positioning: 'bottom-center'
        });
        _this.map.addOverlay(popup);

        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.style.padding = '0.5em';
        div.style.fontSize = '15px';
        div.style.backgroundColor = 'rgba(139, 138, 138, 1)';
        div.style.borderRadius = '1.5rem';

        function displayPopup(evt) {
            var pixel = evt.pixel;
            var res = _this.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return [feature, layer];
            });

            var feat, layer, lname,
                distance, distanceUnit, duration, durationUnit;
            if (res !== undefined) {
                [feat, layer] = res;
                lname = layer.get('name');

                popup.setPosition(evt.coordinate);
                div.style.display = (lname === 'route') ? 'block' : 'none';

                distance = feat.get('distance');
                [distance, distanceUnit] = (distance <= 1000) ? [distance, 'm']
                                                              : [distance / 1000, 'km'];
                distance = distance.toFixed(1);

                duration = feat.get('duration');
                [duration, durationUnit] = (duration <= 3600) ? [duration / 60, 'min']
                                                              : [duration / 3600, 'h'];
                duration = duration.toFixed(1);

                div.innerHTML = `
                    <table>
                        <tr>
                            <th>Distance: </th>
                            <td>${distance} ${distanceUnit}</td>
                        </tr>
                        <tr>
                            <th>Duration: </th>
                            <td>${duration} ${durationUnit}</td>
                        </tr>
                    </table>
                `;
            } else {
                div.style.display = 'none';
            }
        };
        this.map.on('pointermove', displayPopup);
    }

    // geocode
    _geocode(e) {
        // get input
        var _this = this;
        var address = document.getElementById("map-address-input").value;
        if (!address.length) {
            alert("Please provide address...")
            return;
        }

        // fetch
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/
                   ${address}.json?access_token=${_this.apiKey}`;
        fetch(url)
        .then((response) => response.json())
        .then((data) => _this._drawPoint(address, data.features[0]))
        .catch(error => console.log(error));
    }

    // draw point
    _drawPoint(a, d) {
        var _this = this;
        var feature = this.addFeature('address', d.geometry, {
            style: {
                text: {
                    text: wrapText(a, 20, '\n')
                }
            },
            props: {
                name: a
            }
        });
        _this.map.getView().setCenter(olExtent.getCenter(feature.getGeometry().getExtent()));
        _this.map.getView().setZoom(16);
    }

    // draw address bar
    _drawAddressBar() {
        var _this = this;
        var options =  this.addressBarOptions;
        var viewport = this.map.getViewport();

        // div
        // default style options
        var div = document.createElement('div');
        div.style.right = "10px";
        div.style.top = "10px";
        div.style.position = 'absolute';
        div.style.backgroundColor = 'white';
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        // load custom style options
        _this._loadCustomOptions(div, options?.div);

        // add div to map
        div.id = 'map-address';
        var controlPanel = new Control({
            element: div
        });
        this.map.addControl(controlPanel);

        // form
        var form = document.createElement('div');

        // form address
        var input = document.createElement("input");
        input.style.height = "20px";
        input.style.width = "200px";
        input.style.marginRight = "10px";
        input.setAttribute("type", "text");
        input.setAttribute("name", "address");
        input.setAttribute("placeholder", "Add address");
        input.setAttribute("id", "map-address-input");
        _this._loadCustomOptions(input, options?.input);

        var submit = document.createElement("button");
        submit.innerHTML = '<i class="fas fa-search"></i>';
        submit.onclick = function(e) {
            e.preventDefault();
            _this._geocode(e);
        }
        _this._loadCustomOptions(submit, options?.submit);

        // add to document
        form.append(input);
        form.append(submit);
        div.append(form);
    }

    // route
    _route() {
        var _this = this,
            origin = document.getElementById("map-route-origin"),
            destination = document.getElementById("map-route-destination");
        if (!origin.value || !destination.value) {
            alert("Either origin or destination missing...")
            return;
        }

        // fetch
        let extent = [
            origin.getAttribute('coords'),
            destination.getAttribute('coords')
        ].join(',').split(',').map(Number);
        let url = `https://api.mapbox.com/directions/v5/mapbox/driving/
                   ${origin.getAttribute('coords')};${destination.getAttribute('coords')}
                   ?geometries=geojson&access_token=${_this.apiKey}&overview=full`;
        fetch(url)
        .then((response) => response.json())
        .then((data) => _this._drawRoute(data.routes[0], extent))
        .catch(error => console.log(error));
    }

    // draw point
    _drawRoute(r, e) {
        var _this = this;
        this.addFeature('route', r.geometry, {
            props: {
                distance: r.distance,
                duration: r.duration
            }
        });
        this.focusOnLayer(e);
        this.map.getView().setZoom(this.map.getView().getZoom() - 1);
    }

    _changeDirection(e) {
        var origin = document.getElementById('map-route-origin'),
            destination = document.getElementById('map-route-destination'),
            tempValue = origin.value,
            tempCoords = origin.getAttribute('coords');
        origin.value = destination.value;
        origin.setAttribute('coords', destination.getAttribute('coords'));
        destination.value = tempValue;
        destination.setAttribute('coords', tempCoords);
    }

    // draw route bar
    _drawRouteBar() {
        var _this = this;
        var options =  this.addressBarOptions;
        var viewport = this.map.getViewport();

        // div
        // default style options
        var div = document.createElement('div');
        div.style.right = "10px";
        div.style.top = "70px";
        div.style.position = 'absolute';
        div.style.backgroundColor = 'white';
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        // load custom style options
        _this._loadCustomOptions(div, options?.div);

        // add div to map
        div.id = 'map-address';
        var controlPanel = new Control({
            element: div
        });
        this.map.addControl(controlPanel);

        // form
        var form = document.createElement('div');

        // origin
        var input1 = document.createElement("input");
        input1.style.height = "20px";
        input1.style.width = "200px";
        input1.style.marginRight = "10px";
        input1.style.marginBottom = "10px";
        input1.setAttribute("type", "text");
        input1.setAttribute("name", "address");
        input1.setAttribute("placeholder", "Add origin");
        input1.setAttribute("id", "map-route-origin");
        _this._loadCustomOptions(input1, options?.input);

        var change = document.createElement("button");
        change.innerHTML = '<i class="fas fa-arrows-alt-v"</i>';
        change.onclick = function(e) {
            e.preventDefault();
            _this._changeDirection(e);
        }
        _this._loadCustomOptions(change, options?.change);

        var origin = document.createElement('div');
        origin.append(input1);
        origin.append(change);

        // destination
        var input2 = document.createElement("input");
        input2.style.height = "20px";
        input2.style.width = "200px";
        input2.style.marginRight = "10px";
        input2.setAttribute("type", "text");
        input2.setAttribute("name", "address");
        input2.setAttribute("placeholder", "Add destination");
        input2.setAttribute("id", "map-route-destination");
        _this._loadCustomOptions(input2, options?.input);

        var submit = document.createElement("button");
        submit.innerHTML = '<i class="fas fa-arrow-right"</i>';
        submit.onclick = function(e) {
            e.preventDefault();
            _this._route(e);
        }
        _this._loadCustomOptions(submit, options?.submit);

        var destination = document.createElement('div');
        destination.append(input2);
        destination.append(submit);

        // add to document
        form.append(origin);
        form.append(destination);
        div.append(form);
    }
}

// toggle light control
class ToggleLight extends Control {
    constructor(options) {
        options = options || {};

        // default button style
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-lightbulb"></i>';
        button.className = 'ol-toggle-light';
        button.title = "Toggle light"

        const element = document.createElement('div');
        element.className = 'ol-toggle-light ol-unselectable ol-control';
        element.style.top = options.top;
        element.style.left = '.5em';
        element.appendChild(button);

        super({
            element: element
        });

        // target NetworkMap
        this.target = options.target;

        button.addEventListener('click', this.toggleLight.bind(this), false);
    }

    toggleLight() {
        var base = this.target.base;

        // change map base layer
        base.source = base.source == 'cartodb_dark' ? 'cartodb_light' : 'cartodb_dark';
        this.target.changeBase(base);

        // change legend font color
        var color = base.source == 'cartodb_dark' ? 'white' : 'black';

        // change logo & button style
        this.target.stylizeButtons({color: color});
        this.target.addLogo(color);
    }
}