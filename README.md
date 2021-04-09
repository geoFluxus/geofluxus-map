# geofluxus-map

## Map
First, create a target HTML element with a defined id to host the map like:

```<div id="map"></div>```

Then, initialize the map like so:

```const map = new GeofluxusMap({target: "map"});```

The following image should appear on your screen:

![](img/map.png)

Here is an overview of all available options for a map object:

new GeofluxusMap({\
&emsp;&emsp; [target](#ref1): "map",\
&emsp;&emsp; [projection](#ref2): "EPSG:4326",\
&emsp;&emsp; [base](#ref3): {\
&emsp;&emsp; &emsp;&emsp; [source](#ref4): "osm",\
&emsp;&emsp; &emsp;&emsp; opacity: 1.0,\
&emsp;&emsp; },\
&emsp;&emsp; view: {\
&emsp;&emsp; &emsp;&emsp; zoom: 0,\
&emsp;&emsp; &emsp;&emsp; minZoom: undefined,\
&emsp;&emsp; &emsp;&emsp; maxZoom: undefined,\
&emsp;&emsp; &emsp;&emsp; center: [0, 0],\
&emsp;&emsp; }\
&emsp;&emsp; enableZoom: false,\
&emsp;&emsp; enableDrag: false,\
&emsp;&emsp; hover: {\
&emsp;&emsp; &emsp;&emsp; tooltip: {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; style: {...}\
&emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; style: {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; stroke: {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; color: 'rgba(255, 0, 0, 1)',\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; width: 10,\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; fill: {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; color: 'rbga(255, 0, 0, 1)',\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; }\
})


* _<a id="ref1">target</a> (**Mandatory**)_: The id of the HTML element to host the map.
* _<a id="ref2">projection</a>_: The map projection (EPSG code) for rendering geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).
* _<a id="ref3">base</a>_: The map background
    * _<a id="ref4">source</a>_: Background provider (default='osm').\
      **Available providers**: 'osm', 'cartodb_dark', 'cartodb_light'
    * _opacity_: The background opacity. Ranges in [0, 1] (default=1).
* _view_: The map view
    * _zoom_: The zoom level (default=1)
    * _minZoom_: Minimum zoom level (default=undefined)
    * _maxZoom_: Maximum zoom level (default=undefined)
    * _center_: The map center. Coordinates provided in map projection (default=[0, 0])
* _enableZoom_: Enables zoom via mouse / keyboard on top of zoom controls (default=false)
* _enableDrag_: Enables dragging via mouse / keyboard (default=false)
* _hover_: Enables hover interactions
    * _tooltip_: Enables tooltip on hover over feature
      * _style_: 

## Vector layers