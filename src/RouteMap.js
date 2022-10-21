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

        this._addLayers();
        this.focusOnLayer([
          3.31497114423, 50.803721015,
          7.09205325687, 53.5104033474
        ]);
    }

    _addLayers() {
        this.addVectorLayer('address', {style: {
            image: {
              fill: {
                  color: 'red'
              },
              stroke: {
                  color: 'red',
                  width: 2
              },
            }
        }});
    }

    _loadCustomOptions(elem, options) {
        Object.entries(options || {}).forEach(function(pair) {
            var [key, value] = pair;
            elem.style[key] = value;
        })
    }

    // geocode
    _geocode(e) {
        var _this = this;
        var address = document.getElementById("map-address-bar").value;
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${_this.apiKey}`;
        fetch(url)
        .then((response) => response.json())
        .then((data) => _this._drawPoint(data.features[0]))
        .catch(error => alert(error));
    }

    // draw point
    _drawPoint(d) {
        this.addFeature('address', d.geometry);
    }

    // draw address bar
    _drawAddressBar() {
        var _this = this;
        var options =  this.addressBarOptions;
        var viewport = this.map.getViewport();

        // div
        // default style options
        var div = document.createElement('div');
        div.style.right = "1em";
        div.style.top = "1em";
        div.style.maxWidth = '33%';
        div.style.maxHeight = 'calc(100% - 20px)';
        div.style.position = 'absolute';
        div.style.backgroundColor = 'white';
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        // load custom style options
        _this._loadCustomOptions(div, options?.div);

        // add div to map
        div.id = 'address';
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
        input.setAttribute("placeholder", "Fill address");
        input.setAttribute("id", "map-address-bar");
        _this._loadCustomOptions(input, options?.input);

        var submit = document.createElement("button");
        submit.innerHTML = "Submit";
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