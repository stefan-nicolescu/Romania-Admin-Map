# Romania Administrative Map

### Description and Usage
An interactive map of Romania's administrative units. The map can be explored in drill-down mode, where clicking on an unit on the map reveals its sub-units. The map can also be explored by turning on/off the layers using a control panel with radio buttons. The table and chart to the side summarize the data for each county.
The map uses random data.

### Technical Details
Each layer on the map was generated using a GeoJSON. Each GeoJSON is a collection of JS objects that represent the polygons on the map.

In order to allow an easier update of the data behind the map, an external CSV was used to store data that can be subject to change. A merger is performed between the GeoJSON and the CSV so that the GeoJSON handled to Leaflet containts the latest data.
Updating GeoJSON manually is laborious and prone to errors.

The Leaflet JS library was used to display the map and make it interactive. D3.js was used to generate the bar chart showing numeric values for each county. Papa Parse was used for parsing the CSV fetched from Github.

### Limitations
+ not the most intuitive drilldown;
+ table and chart only for Value 1;


### To Do
+ use real data and give it some form of utility;
+ add another level down (UAT - comune);
+ add search bar;
+ update table and chart when switching between Value 1 and Value 2;

### Libraries and Plugins
Leaflet: https://leafletjs.com/

Leaflet.EasyButton: https://github.com/CliffCloud/Leaflet.EasyButton

D3.js: https://d3js.org/

Papa Parse: https://www.papaparse.com/

### GIS Data
Shapefiles Romania: https://geoportal.ancpi.ro/portal/home/

Shapefiles NUTS: https://ec.europa.eu/eurostat/web/gisco/geodata/reference-data/administrative-units-statistical-units/nuts

### License
_Under Construction_
