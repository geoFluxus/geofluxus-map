import Map from "./Map";
import { _default } from './utils.js';
import Control from 'ol/control/Control';


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

        // hover
        options.hover = _default(options.hover, {
            style: {
                image: {
                    radius: 7
                }
            }
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

        this._addLayers();
        this.focusOnLayer([
          3.31497114423, 50.803721015,
          7.09205325687, 53.5104033474
        ]);
    }

    _addLayers() {
        this.addVectorLayer('address');
    }

    _loadCustomOptions(elem, options) {
        Object.entries(options || {}).forEach(function(pair) {
            var [key, value] = pair;
            elem.style[key] = value;
        })
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
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${_this.apiKey}`;
        fetch(url)
        .then((response) => response.json())
        .then((data) => _this._drawPoint(address, data.features[0]))
        .catch(error => alert(error));
    }

    // draw point
    _drawPoint(a, d) {
        this.addFeature('address', d.geometry, {
            props: {
                address: a
            },
            style: {
                image: {
                    fill: {
                      color: 'red'
                    },
                    stroke: {
                      color: 'red',
                      width: 2
                    },
                },
                text: {
                    text: a,
                    fontSize: 15,
                    textAlign: 'left',
                    offsetX: 10,
                    color: 'red'
                }
            }
        });
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
        var form = document.createElement('form');

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
    _route(e) {
        var _this = this,
            origin = document.getElementById("map-route-origin").value,
            destination = document.getElementById("map-route-destination").value;
        if (!origin.length || !destination.length) {
            alert("Either origin or destination missing...")
            return;
        }
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
        var form = document.createElement('form');

        // form address
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
        submit.innerHTML = '<i class="fas fa-arrows-alt-h"</i>';
        submit.onclick = function(e) {
            e.preventDefault();
            _this._route(e);
        }
        _this._loadCustomOptions(submit, options?.submit);

        // add to document
        form.append(input1);
        form.innerHTML += "<br>";
        form.append(input2);
        form.append(submit);
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