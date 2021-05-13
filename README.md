# geofluxus-map
Powered by [OpenLayers](https://openlayers.org/) & [d3](https://d3js.org/). Check examples on JS (examples) and ReactJS (react-examples).

To use, either install through NPM:
```
npm install geofluxus-map
```
or add the following in vanilla:
```
<script src="https://cdn.jsdelivr.net/npm/geofluxus-map@version/dist/index.js"></script>
<link href="https://cdn.jsdelivr.net/npm/geofluxus-map@version/dist/index.css" rel="stylesheet" type="text/css">
```


The following visualizations are available:
* [**Map**](#map): A basic visualization for creating and styling simple maps with tooltips
* [**NetworkMap**](#networkmap): A map visualization for distributions along road networks
* [**FlowMap**](#flowmap): A map visualization for data flows

To initialize any visualization, first create a target HTML element with id to host the map:
```
<div id="map"></div>
```

**ATTENTION!** Make sure that you have specified both the width and height of the target element.

Then, initialize a simple map in NodeJS:
```
import Map from 'geofluxus-map';
const map = new Map({target: "map"});
```
or in vanilla JS:
```
const map = new gFMap.Map({target: "map"});
```

## Map
new Map(options)

### Options
* **<a id="map-target">target</a>** (_string_): The id of the HTML element to host the map.
  

* **<a id="map-projection">projection</a>** (_string_): The map projection ([EPSG code](https://epsg.io/)) for rendering feature geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).


* **<a id="map-base">base</a>** (_object_): The map background
    * **<a id="map-base-source">source</a>** (_string_): Background provider (default='osm').\
      **Available options**: 'osm', 'cartodb_dark', 'cartodb_light'
    * **<a id="map-base-opacity">opacity</a>** (_float_): The background opacity. Ranges in [0, 1] (default=1).
    

* **<a id="map-view">view</a>** (_object_): The map view
    * **<a id="map-view-zoom">zoom</a>** (_object_): The zoom level (default=1)
    * **<a id="map-view-minzoom">minZoom</a>** (_float_): Minimum zoom level (default=undefined)
    * **<a id="map-view-maxzoom">maxZoom</a>**  (_float_): Maximum zoom level (default=undefined)
    * **<a id="map-view-center">center</a>** (_Array_): The map center. Coordinates provided in map projection (default=[0, 0])
    

* **<a id="map-controls">controls</a>** (_object_): Enables / disables map control buttons on the top left corner of the map. All buttons are active by default.
  * **<a id="map-controls-zoom">zoom</a>** (_boolean_): Allows zooming via mouse & keyboard. If disabled, zoom is available only via the map zoom controls on the top left corner of the map.
  * **<a id="map-controls-drag">drag</a>** (_boolean_): Allows dragging along the map
  * **<a id="map-controls-fullscreen">fullscreen</a>** (_boolean_): Activates the fullscreen button
  * **<a id="map-controls-reset">reset</a>** (_boolean_): Activates the reset button. Allows to reset to the initial view extent (either the initial map view or one specified by focusing on certain layer)
  * **<a id="map-controls-exportpng">exportPNG</a>** (_boolean_): Activates the screenshot button. Allow to export a png version of the map on the current view. 


* **<a id="map-hover">hover</a>** (_object_): Enables hover interactions
    * **<a id="map-hover-tooltip">tooltip</a>** (_object_): Enables HTML div tooltip on hover over feature.
      * **<a id="map-hover-tooltip-body">body</a>** (_function_): A function which iterates through the map features and load the tooltip content in HTML
      * **<a id="map-hover-tooltip-style">style</a>** (_object_): Define tooltip style as an object with CSS properties such as borderRadius, fontFamily etc.
    * **<a id="map-hover-style">style</a>** (_object_): Enables feature highlighting on hover, defined as an OpenLayers style object.
      * **<a id="map-hover-style-stroke">stroke</a>** (_object_): Style of feature boundary.
        * **<a id="map-hover-style-stroke-color">color</a>** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **<a id="map-hover-style-stroke-width">width</a>** (_float_): Stroke width.
      * **<a id="map-hover-style-fill">fill</a>** (_object_): Style of feature surface.
        * **<a id="map-hover-style-fill-color">color</a>** (_string_): Fill color. Available formats: RGB, RGBA, HEX.
      * **<a id="map-hover-style-zindex">zIndex</a>** (_float_): Define z-index for a highlighted feature
    

### Methods
* **<a id="map-addvectorlayer">addVectorLayer(name, options)</a>**
  #### Description
  Define a vector layer to load geometric features on it\
  **ATTENTION!** For multiple layers, make sure each of them has a unique name. Keep in mind that each layer can host ONLY one type of geometry (see the available options for a vector layer below).
  #### Arguments
  * **<a id="map-addvectorlayer-name">name</a>** (_string_): A string to define the layer name
  * **<a id="map-addvectorlayer-options">options</a>** (_object_):
    * **<a id="map-addvectorlayer-options-style">style</a>** (_object_): Define an OpenLayers style for the layer
      * **<a id="map-addvectorlayer-options-style-stroke">stroke</a>** (_object_): Style of feature boundary
        * **<a id="map-addvectorlayer-options-style-stroke-color">color</a>** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **<a id="map-addvectorlayer-options-style-stroke-width">width</a>** (_float_): Stroke width
      * **<a id="map-addvectorlayer-options-style-fill">fill</a>** (_object_): Style of feature surface
        * **<a id="map-addvectorlayer-options-style-fill-color">color</a>** (_string_): Fill color. Available formats: RGB, RGBA, HEX
      * **<a id="map-addvectorlayer-options-style-zindex">zIndex</a>** (_float_): Define z-index for layer features    
      * **<a id="map-addvectorlayer-options-style-image">image</a>** (_object_): (For point layers) Define circle style
        * **<a id="map-addvectorlayer-options-style-image-radius">radius</a>** (_float_): Circle radius
          * **<a id="map-addvectorlayer-options-style-image-stroke">stroke</a>** (_object_): Style of feature boundary
            * **<a id="map-addvectorlayer-options-style-image-stroke-color">color</a>** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
            * **<a id="map-addvectorlayer-options-style-image-stroke-width">width</a>** (_float_): Stroke width
          * **<a id="map-addvectorlayer-options-style-image-fill">fill</a>** (_object_): Style of feature surface
            * **<a id="map-addvectorlayer-options-style-image-fill-color">color</a>** (_string_): Fill color. Available formats: RGB, RGBA, HEX
    

* **<a id="map-addfeature">addFeature(layer, geometry, options)</a>**
  #### Description
  Add feature to an existing layer
  #### Arguments
  * **<a id="map-addfeature-name">name</a>** (_string_): The layer name to which the feature belongs
  * **<a id="map-addfeature-geometry">geometry</a>** (_object_): The feature geometry. Should be provided from [GeoJSON](https://geojson.org/) format
    containing (a) the geometry type & (b) the geometry coordinates.\
    **Supported geometry types**: Point, LineString, MultiLineString, Polygon, MultiPolygon
  * **<a id="map-addfeature-options">options</a>** (_object_):
    * **<a id="map-addfeature-options-style">style</a>** (_object_): OpenLayers style for feature
      * **<a id="map-addfeature-options-style-stroke">stroke</a>** (_object_): Style of feature boundary.
        * **<a id="map-addfeature-options-style-stroke-color">color</a>** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **<a id="map-addfeature-options-style-stroke-width">width</a>** (_float_): Stroke width.
      * **<a id="map-addfeature-options-style-fill">fill</a>** (_object_): Style of feature surface.
        * **<a id="map-addfeature-options-style-fill-color">color</a>** (_string_): Fill color. Available formats: RGB, RGBA, HEX.
      * **<a id="map-addfeature-options-style-zindex">zIndex</a>** (_float_): Layer z-index. By default, OpenLayers renders features in Last In, FirstOut order (the last layer declared is rendered on canvas top).
    * **<a id="map-addfeature-options-props">props</a>** (_object_): Add to feature properties other than geometry with key-value pairs (ie. if you want to later call
      them in the map tooltip)


* **<a id="map-focusonlayer">focusOnLayer(name)</a>**
  #### Description
  Set map view to the extent of an existing layer

  #### Arguments
  * **<a id="map-focusonlayer-name">name</a>** (_string_): The name of the layer to focus on
  
  

* **<a id="map-setvisible">setVisible(name, visible)</a>**
  #### Description
  Change visibility of an existing layer

  #### Arguments
  * **<a id="map-setvisible-name">name</a>** (_string_): The layer name
  * **<a id="map-setvisible-visible">visible</a>** (_boolean_): Turn to visible (true) or not (false)  
  

* **<a id="map-changebase">changeBase(base)</a>**
  #### Description
  Change base layer of map

  #### Arguments
  * **<a id="map-changebase-base">base</a>** (_string_): The source name of the new base layer (check [here](#map-base-source) for options)
  

* **<a id="map-stylizebuttons">stylizeButtons(options)</a>**
  #### Description
  Change the style of the map buttons

  #### Arguments
  * **<a id="map-stylizebuttons-options">options</a>** (_object_): Define button style as an object with CSS properties such as borderRadius, fontFamily etc.
    

## <a id="networkmap"></a>NetworkMap (extends Map)
new NetworkMap(options)

### Options
* **<a id="networkmap-controls">controls</a>** (_object_): Enables / disables control on top of basic map controls
  (check [here](#map-controls))
  * **<a id="networkmap-controls-togglenetwork">toggleNetwork</a>** (_boolean_): Allows to show/hide parts of network with zero amount
  * **<a id="networkmap-controls-togglelegend">toggleLegend</a>** (_boolean_): Allows to show/hide the map legend
  * **<a id="networkmap-controls-togglelight">toggleLight</a>** (_boolean_): Allows to interchange between dark & light mode map
* **<a id="networkmap-data">data</a>** (_Array_): Loads the network map data
* **<a id="networkmap-scale">scale</a>** (_Array_): A array of strings which defines the map color scale. Default color scale provided by
  [ColorBrewer](https://colorbrewer2.org)
* **<a id="networkmap-legend">legend</a>** (_object_): Defines the legend title, width, height and other CSS properties
  * **<a id="networkmap-legend-title">title</a>** (_string_): The legend title
  * **<a id="networkmap-legend-width">width</a>** (_float_): The legend width provided in pixels
  * **<a id="networkmap-legend-height">height</a>** (_float_): The legend height provided in pixels


## <a id="flowmap"></a>FlowMap (extends Map)
new FlowMap(options)

### Options
* **<a id="flowmap-controls">controls</a>** (_object_): Enables / disables control on top of basic map controls
  (check [here](#map-controls))
  * **<a id="flowmap-controls-toggleflows">toggleFlows</a>** (_boolean_): Allows to show/hide map flows
  * **<a id="flowmap-controls-togglenodes">toggleNodes</a>** (_boolean_): Allows to show/hide map nodes
  * **<a id="flowmap-controls-animate">animate</a>** (_boolean_): Allows to animate flows
  * **<a id="flowmap-controls-togglelegend">toggleLegend</a>** (_boolean_): Allows to show/hide the map legend
  * **<a id="flowmap-controls-togglelight">toggleLight</a>** (_boolean_): Allows to interchange between dark & light mode map
* **<a id="flowmap-data">data</a>** (_Array_): Loads the flowmap data
* **<a id="flowmap-scale">scale</a>** (_Array_): A array of strings which defines the map color scale. Default color scale provided by
  [ColorBrewer](https://colorbrewer2.org)
* **<a id="flowmap-groupby">groupBy</a>** (_Array_): The property for splitting and coloring flows into groups
* **<a id="flowmap-minflowwidth">minFlowWidth</a>** (_float_): The minimum flow width
* **<a id="flowmap-maxflowwidth">maxFlowWidth</a>** (_float_): The maximum flow width
* **<a id="flowmap-animate">animate</a>** (_float_): Defines the default animation mode\
  **Available options**: 0 (No animation), 1 (Dash animation)
* **<a id="flowmap-legend">legend</a>** (_object_): Defines the legend title and other CSS properties
  * **<a id="flowmap-legend-title">title</a>** (_string_): The legend title
* **<a id="flowmap-tooltip">tooltip</a>** (_object_): The map tooltip. Overrides the map hover option.
  * **<a id="flowmap-tooltip-body">body</a>** (_function_): A function which iterates through the map features and load the tooltip content in HTML
  * **<a id="flowmap-tooltip-style">style</a>** (_object_): Define tooltip style as an object with CSS properties such as borderRadius, fontFamily etc.