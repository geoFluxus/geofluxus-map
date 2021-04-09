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
&emsp;&emsp; &emsp;&emsp; [opacity](#ref5): 1.0,\
&emsp;&emsp; },\
&emsp;&emsp; [view](#ref6): {\
&emsp;&emsp; &emsp;&emsp; [zoom](#ref7): 0,\
&emsp;&emsp; &emsp;&emsp; [minZoom](#ref8): undefined,\
&emsp;&emsp; &emsp;&emsp; [maxZoom](#ref9): undefined,\
&emsp;&emsp; &emsp;&emsp; [center](#ref10): [0, 0],\
&emsp;&emsp; }\
&emsp;&emsp; [enableZoom](#ref11): false,\
&emsp;&emsp; [enableDrag](#ref12): false,\
&emsp;&emsp; [hover](#ref13): {\
&emsp;&emsp; &emsp;&emsp; [tooltip](#ref14): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [style](#ref15): {...}\
&emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; [style](#ref16): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [stroke](#ref17): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [color](#ref18): 'rgba(255, 0, 0, 1)',\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [width](#ref19): 10,\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [fill](#ref20): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [color](#ref21): 'rbga(255, 0, 0, 1)',\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; }\
})


* _<a id="ref1">target</a> (**Mandatory**)_: The id of the HTML element to host the map.
* _<a id="ref2">projection</a>_: The map projection (EPSG code) for rendering geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).
* _<a id="ref3">base</a>_: The map background
    * _<a id="ref4">source</a>_: Background provider (default='osm').\
      **Available providers**: 'osm', 'cartodb_dark', 'cartodb_light'
    * _<a id="ref5">opacity</a>_: The background opacity. Ranges in [0, 1] (default=1).
* _<a id="ref6">view</a>_: The map view
    * _<a id="ref7">zoom</a>_: The zoom level (default=1)
    * _<a id="ref8">minZoom</a>_: Minimum zoom level (default=undefined)
    * _<a id="ref9">maxZoom</a>_: Maximum zoom level (default=undefined)
    * _<a id="ref10">center</a>_: The map center. Coordinates provided in map projection (default=[0, 0])
* _<a id="ref11">enableZoom</a>_: Enables zoom via mouse / keyboard on top of zoom controls (default=false)
* _<a id="ref12">enableDrag</a>_: Enables dragging via mouse / keyboard (default=false)
* _<a id="ref13">hover</a>_: Enables hover interactions
    * _<a id="ref14">tooltip</a>_: Enables tooltip on hover over feature
      * _style_: 

## Vector layers