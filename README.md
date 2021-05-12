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
* **target** (_string_): The id of the HTML element to host the map.
  

* **projection** (_string_): The map projection ([EPSG code](https://epsg.io/)) for rendering feature geometries. The default projection for input geometries is **EPSG:4326** (WGS84) which corresponds to longitude / latitude coordinates. All input geometries are transformed to EPSG:3857 (Web Mercator).


* **base** (_object_): The map background
    * **<a id="map-base-source">source</a>** (_string_): Background provider (default='osm').\
      **Available options**: 'osm', 'cartodb_dark', 'cartodb_light'
    * **opacity** (_float_): The background opacity. Ranges in [0, 1] (default=1).
    

* **view** (_object_): The map view
    * **zoom** (_object_): The zoom level (default=1)
    * **minZoom** (_float_): Minimum zoom level (default=undefined)
    * **maxZoom**  (_float_): Maximum zoom level (default=undefined)
    * **center** (_Array_): The map center. Coordinates provided in map projection (default=[0, 0])
    

* **controls** (_object_): Enables / disables map control buttons on the top left corner of the map. All buttons are active by default.
  * **zoom** (_boolean_): Allows zooming via mouse & keyboard. If disabled, zoom is available only via the map zoom controls on the top left corner of the map.
  * **drag** (_boolean_): Allows dragging along the map
  * **fullscreen** (_boolean_): Activates the fullscreen button
  * **reset** (_boolean_): Activates the reset button. Allows to reset to the initial view extent (either the initial map view or one specified by focusing on certain layer)
  * **exportPNG** (_boolean_): Activates the screenshot button. Allow to export a png version of the map on the current view. 


* **hover** (_object_): Enables hover interactions
    * **tooltip** (_object_): Enables HTML div tooltip on hover over feature.
      * **body** (_function_): A function which iterates through the map features and load the tooltip content in HTML
      * **style** (_object_): Define tooltip style as an object with CSS properties such as borderRadius, fontFamily etc.
    * **style** (_object_): Enables feature highlighting on hover, defined as an OpenLayers style object.
      * **stroke** (_object_): Style of feature boundary.
        * **color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **width** (_float_): Stroke width.
      * **fill** (_object_): Style of feature surface.
        * **color** (_string_): Fill color. Available formats: RGB, RGBA, HEX.
      * **zIndex** (_float_): Define z-index for a highlighted feature
    

### Methods
* **addVectorLayer(name, options)**
  #### Description
  Define a vector layer to load geometric features on it\
  **ATTENTION!** For multiple layers, make sure each of them has a unique name. Keep in mind that each layer can host ONLY one type of geometry (see the available options for a vector layer below).
  #### Arguments
  * **name** (_string_): A string to define the layer name
  * **options** (_object_):
    * **style** (_object_): Define an OpenLayers style for the layer
      * **stroke** (_object_): Style of feature boundary
        * **color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **width** (_float_): Stroke width
      * **fill** (_object_): Style of feature surface
        * **color** (_string_): Fill color. Available formats: RGB, RGBA, HEX
      * **zIndex** (_float_): Define z-index for layer features    
      * **image** (_object_): (For point layers) Define circle style
        * **radius** (_float_): Circle radius
          * **stroke** (_object_): Style of feature boundary
            * **color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
            * **width** (_float_): Stroke width
          * **fill** (_object_): Style of feature surface
            * **color** (_string_): Fill color. Available formats: RGB, RGBA, HEX
    

* **addFeature(layer, geometry, options)**
  #### Description
  Add feature to an existing layer
  #### Arguments
  * **name** (_string_): The layer name to which the feature belongs
  * **geometry** (_object_): The feature geometry. Should be provided from [GeoJSON](https://geojson.org/) format
    containing (a) the geometry type & (b) the geometry coordinates.\
    **Supported geometry types**: Point, LineString, MultiLineString, Polygon, MultiPolygon
  * **options** (_object_):
    * **style** (_object_): OpenLayers style for feature
      * **stroke** (_object_): Style of feature boundary.
        * **color** (_string_): Stroke color. Available formats: RGB, RGBA, HEX.
        * **width** (_float_): Stroke width.
      * **fill** (_object_): Style of feature surface.
        * **color** (_string_): Fill color. Available formats: RGB, RGBA, HEX.
      * **zIndex** (_float_): Layer z-index. By default, OpenLayers renders features in Last In, FirstOut order (the last layer declared is rendered on canvas top).
    * **props** (_object_): Add to feature properties other than geometry with key-value pairs (ie. if you want to later call
      them in the map tooltip)


* **focusOnLayer(name)**
  #### Description
  Set map view to the extent of an existing layer

  #### Arguments
  * **name** (_string_): The name of the layer to focus on
  
  

* **setVisible(name, visible)**
  #### Description
  Change visibility of an existing layer

  #### Arguments
  * **name** (_string_): The layer name
  * **visible** (_boolean_): Turn to visible (true) or not (false)  
  

* **changeBase(base)**
  #### Description
  Change base layer of map

  #### Arguments
  * **base** (_string_): The source name of the new base layer (check [here](#map-base-source) for options)
  

* **stylizeButtons(options)**
  #### Description
  Change the style of the map buttons

  #### Arguments
  * **options** (_object_): Define button style as an object with CSS properties such as borderRadius, fontFamily etc.



## <a id="networkmap"></a>NetworkMap

## <a id="flowmap"></a>FlowMap