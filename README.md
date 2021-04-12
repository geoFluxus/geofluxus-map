# geofluxus-map
Powered by [OpenLayers](https://openlayers.org/).

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
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [style](#ref15): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; borderRadius: ...\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; fontFamily: ...\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; ...\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; [style](#ref16): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [stroke](#ref17): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [color](#ref18): ...,\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [width](#ref19): ...,\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; },\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [fill](#ref20): {\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; &emsp;&emsp; [color](#ref21): ...,\
&emsp;&emsp; &emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; &emsp;&emsp; }\
&emsp;&emsp; }\
})


* _<a id="ref1">target</a> (**Mandatory**)_: The id of the HTML element to host the map.
* _<a id="ref2">projection</a>_: The map projection (EPSG code) for rendering feature geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).
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
    * _<a id="ref14">tooltip</a>_: Enables HTML div tooltip on hover over feature.
      * _<a id="ref15">style</a>_: Tooltip style. Edit HTML div properties such as borderRadius, fontFamily etc.
    * _<a id="ref16">style</a>_: Enables feature highlighting on hover, defined as an OpenLayers style object.
      * _<a id="ref17">stroke</a>_: Style of feature boundary.
        * _<a id="ref18">color</a>_: Stroke color. Available formats: RGB, RGBA, HEX.
        * _<a id="ref19">width</a>_: Stroke width.
      * _<a id="ref20">fill</a>_: Style of feature surface.
        * _<a id="ref21">color</a>_: Fill color. Available formats: RGB, RGBA, HEX.
    
**ATTENTION!** We recommend to provide values for ALL available options when defining an OpenLayers style object.

## Vector layers
To add features to the map, you need first to define a vector layer. You can simply do this by just providing a name for the given layer:
```
map.addVectorLayer('areas');
```
**ATTENTION!** For multiple layers, make sure each of them has a unique name. Keep in mind that each layer can host ONLY one type of geometry (see the available options for a vector layer below).

Here is an overview of all available options for a vector layer:

map.addVectorLayer([name](#ref22), {\
&emsp;&emsp; [style](#ref23): {\
&emsp;&emsp;&emsp;&emsp; [stroke](#ref24): {\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [color](#ref25): ...,\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [width](#ref26): ...\
&emsp;&emsp;&emsp;&emsp; },\
&emsp;&emsp;&emsp;&emsp; [fill](#ref27): {\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [color](#ref28): ...\
&emsp;&emsp;&emsp;&emsp; },\
&emsp;&emsp;&emsp;&emsp; [zIndex](#ref29): ...\
&emsp;&emsp; }\
})

* _<a id="ref22">name</a> (**Mandatory**)_: Layer name. Unique for each layer
* _options_:
  * _<a id="ref23">style</a>_: OpenLayers style for all layer features
    * _<a id="ref24">stroke</a>_: Style of feature boundary.
        * _<a id="ref25">color</a>_: Stroke color. Available formats: RGB, RGBA, HEX.
        * _<a id="ref26">width</a>_: Stroke width.
    * _<a id="ref27">fill</a>_: Style of feature surface.
        * _<a id="ref28">color</a>_: Fill color. Available formats: RGB, RGBA, HEX.
    * _<a id="ref29">zIndex</a>_: Layer z-index. By default, OpenLayers renders layers in Last In, FirstOut order (the last layer declared is rendered on canvas top).
    
Once defined, you can populate the layer with features:
```
map.addFeature(name, geometry);
```
If provided, features inherit the given layer style. Nevertheless, you can always define different styles for each individual feature if necessary.

Here is an overview for all available options for vector layer features:

map.addFeature([layer](#ref30), [geometry](#ref31), {\
&emsp;&emsp; [style](#ref32): {\
&emsp;&emsp;&emsp;&emsp; [stroke](#ref33): {\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [color](#ref34): ...,\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [width](#ref35): ...\
&emsp;&emsp;&emsp;&emsp; },\
&emsp;&emsp;&emsp;&emsp; [fill](#ref36): {\
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; [color](#ref37): ...\
&emsp;&emsp;&emsp;&emsp; },\
&emsp;&emsp;&emsp;&emsp; [zIndex](#ref38): ...\
&emsp;&emsp; },\
&emsp;&emsp; [tooltip](#ref39): ...\
})

* _<a id="ref30">layer</a> (**Mandatory**)_: The layer name to which the feature belongs
* _<a id="ref31">geometry</a> (**Mandatory**)_: The feature geometry. Should be provided from [GeoJSON](https://geojson.org/) format.
* _options_:
    * _<a id="ref32">style</a>_: OpenLayers style for feature
    * _<a id="ref33">stroke</a>_: Style of feature boundary.
        * _<a id="ref34">color</a>_: Stroke color. Available formats: RGB, RGBA, HEX.
        * _<a id="ref35">width</a>_: Stroke width.
    * _<a id="ref36">fill</a>_: Style of feature surface.
        * _<a id="ref37">color</a>_: Fill color. Available formats: RGB, RGBA, HEX.
    * _<a id="ref38">zIndex</a>_: Layer z-index. By default, OpenLayers renders features in Last In, FirstOut order (the last layer declared is rendered on canvas top).
    * _<a id="ref39">tooltip</a>_: The tooltip info for the feature