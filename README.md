# geofluxus-map
Powered by [OpenLayers](https://openlayers.org/) & [d3](https://d3js.org/). Check examples on JS (examples) and ReactJS (react-examples).

The following visualizations are available:
* [**Map**](#map): A basic visualization for creating and styling simple maps with tooltips
* [**NetworkMap**](#networkmap): A map visualization for distributions along road networks
* [**FlowMap**](#flowmap): A map visualization for data flows

To initialize any visualization, first create a target HTML element with id to host the map:

```<div id="map"></div>```

**ATTENTION!** Make sure that you have specified both the width and height of the target element.

Then, initialize a simple map for example like so:

```const map = new Map({target: "map"});```


## Map
new Map(options)

### Options
* **<span style="color:grey">target</span>** (_string_): The id of the HTML element to host the map.
  

* **<span style="color:grey">projection** (_string_): The map projection ([EPSG code](https://epsg.io/)) for rendering feature geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).


* **<span style="color:grey">base** (_object_): The map background
    * **<span style="color:grey">source** (_string_): Background provider (default='osm').\
      **Available options**: 'osm', 'cartodb_dark', 'cartodb_light'
    * **<span style="color:grey">opacity** (_float_): The background opacity. Ranges in [0, 1] (default=1).
    

* **<span style="color:grey">view** (_object_): The map view
    * **<span style="color:grey">zoom** (_object_): The zoom level (default=1)
    * **<span style="color:grey">minZoom** (_float_): Minimum zoom level (default=undefined)
    * **<span style="color:grey">maxZoom**  (_float_): Maximum zoom level (default=undefined)
    * **<span style="color:grey">center** (_Array_): The map center. Coordinates provided in map projection (default=[0, 0])
    

* **<span style="color:grey">controls** (_object_): Enables / disables map control buttons on the top left corner of the map. All buttons are active by default.
  * **<span style="color:grey">zoom** (_boolean_): Allows zooming via mouse & keyboard. If disabled, zoom is available only via the map zoom controls on the top left corner of the map.
  * **<span style="color:grey">drag** (_boolean_): Allows dragging along the map
  * **<span style="color:grey">fullscreen** (_boolean_): Activates the fullscreen button
  * **<span style="color:grey">reset** (_boolean_): Activates the reset button. Allows to reset to the initial view extent (either the initial map view or one specified by focusing on certain layer)
  * **<span style="color:grey">exportPNG** (_boolean_): Activates the screenshot button. Allow to export a png version of the map on the current view. 


* **<span style="color:grey">hover** (_object_): Enables hover interactions
    * **<span style="color:grey">tooltip** (_object_): Enables HTML div tooltip on hover over feature.
      * **<span style="color:grey">body** (_function_): A function which iterates through the map features and load the tooltip content in HTML
      * **<span style="color:grey">style** (_object_): Define tooltip style as an object with CSS properties such as borderRadius, fontFamily etc.
    * **<span style="color:grey">style** (_object_): Enables feature highlighting on hover, defined as an OpenLayers style object.
      * **<span style="color:grey">stroke** (_object_): Style of feature boundary.
        * **<span style="color:grey">color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **<span style="color:grey">width** (_float_): Stroke width.
      * **<span style="color:grey">fill** (_object_): Style of feature surface.
        * **<span style="color:grey">color** (_string_): Fill color. Available formats: RGB, RGBA, HEX.
      * **<span style="color:grey">zIndex** (_float_): Define z-index for a highlighted feature
    

### Methods
* **<span style="color:grey">addVectorLayer(name, options)**
  #### Description
  Define a vector layer to load geometric features on it\
  **ATTENTION!** For multiple layers, make sure each of them has a unique name. Keep in mind that each layer can host ONLY one type of geometry (see the available options for a vector layer below).
  #### Arguments
  * **<span style="color:grey">name** (_string_): A string to define the layer name
  * **<span style="color:grey">options** (_object_):
    * **<span style="color:grey">style** (_object_): Define an OpenLayers style for the layer
      * **<span style="color:grey">stroke** (_object_): Style of feature boundary
        * **<span style="color:grey">color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **<span style="color:grey">width** (_float_): Stroke width
      * **<span style="color:grey">fill** (_object_): Style of feature surface
        * **<span style="color:grey">color** (_string_): Fill color. Available formats: RGB, RGBA, HEX
      * **<span style="color:grey">zIndex** (_float_): Define z-index for layer features    
      * **<span style="color:grey">image** (_object_): (For point layers) Define circle style
        * **<span style="color:grey">radius** (_float_): Circle radius
          * **<span style="color:grey">stroke** (_object_): Style of feature boundary
            * **<span style="color:grey">color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
            * **<span style="color:grey">width** (_float_): Stroke width
          * **<span style="color:grey">fill** (_object_): Style of feature surface
            * **<span style="color:grey">color** (_string_): Fill color. Available formats: RGB, RGBA, HEX
    

* **<span style="color:grey">addFeature(layer, geometry, options)**
  #### Description
  Add feature to an existing layer
  #### Arguments
  * **<span style="color:grey">name** (_string_): The layer name to which the feature belongs
  * **<span style="color:grey">geometry** (_object_): The feature geometry. Should be provided from [GeoJSON](https://geojson.org/) format
    containing (a) the geometry type & (b) the geometry coordinates.\
    **Supported geometry types**: Point, LineString, MultiLineString, Polygon, MultiPolygon
  * **<span style="color:grey">options** (_object_):
    * **<span style="color:grey">style** (_object_): OpenLayers style for feature
      * **<span style="color:grey">stroke** (_object_): Style of feature boundary.
        * _<a id="ref34">color</a>_: Stroke color. Available formats: RGB, RGBA, HEX.
        * _<a id="ref35">width</a>_: Stroke width.
    * _<a id="ref36">fill</a>_: Style of feature surface.
        * _<a id="ref37">color</a>_: Fill color. Available formats: RGB, RGBA, HEX.
    * _<a id="ref38">zIndex</a>_: Layer z-index. By default, OpenLayers renders features in Last In, FirstOut order (the last layer declared is rendered on canvas top).
    * _<a id="ref39">tooltip</a>_: The tooltip info for the feature  


* focusOnLayer()
  

* setVisible(name, visible)
  

* changeBase(base)
  

* stylizeButtons(options)



## <a id="networkmap"></a>NetworkMap

## <a id="flowmap"></a>FlowMap