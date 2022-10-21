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

        // change logo & button style
        this.stylizeButtons({color: 'white'});
        this.addLogo('white');

        // address bar
        this.addressOptions = options.address || {};
        this._drawAddress();
    }

    // draw address bar
    _drawAddress() {
        var _this = this;
        var options =  this.addressOptions;
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
        Object.entries(options).forEach(function(pair) {
            var [key, value] = pair;
            _this.legend.style[key] = value;
        })

        // add div to map
        div.id = 'address';
        var controlPanel = new Control({
            element: div
        });
        this.map.addControl(controlPanel);

        // form
        var form = document.createElement('form');
        var address = document.createElement("input");
        address.style.height = "20px";
        address.style.width = "200px";
        address.setAttribute("type", "text");
        address.setAttribute("name", "address");
        address.setAttribute("placeholder", "Fill address");
        form.append(address);
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