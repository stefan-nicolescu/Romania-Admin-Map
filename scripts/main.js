// ---------------DATA ---------------

let csvData; // store content from the CSV (retrieved from Github)

// create arrays to contain data about counties 
let arrayIds = []; // array for counties ids
let arrayNames = []; // array for counties names
let arrayValue1 = []; // array for counties value 1
let arrayValue2 = []; // array for counties value 2

// get the CSV from Github and convert to JS array of objects
function getCSV(callback) {
	let csvLink = 'https://raw.githubusercontent.com/stefan-nicolescu/Romania-Admin-Map/main/data/data_judete.csv';
  $.get(csvLink, function(csvString) {
    // use PapaParse to convert string to array of objects
    csvData = Papa.parse(csvString, {header: true, dynamicTyping: true, skipEmptyLines: true}).data;
    // console.log(csvData);
    // console.log("function getCSV() executed");
    callback(); // use callback to control order in which functions are executed
  });
}

// merge the data from the GeoJSON to the data retrieved from the CSV
function mergeData(callback) {
	let initialFeatures = ro_NUTS_3.features; // initial GeoJSON Features 
	let updatedProperties = []; // updated GeoJSON properties 
	let csvIDs = []; // ids of points from the CSV data

	// iterate the CSV to populate the arrays used by tables and charts
	// it needs to be separate from the same iterations that that takes place below
  for (let j = 0; j < csvData.length; j++) {  
		arrayIds.push(csvData[j].MY_ID); 
		arrayNames.push(csvData[j].NUTS_NAME); 
		arrayValue1.push(csvData[j].VALUE_1); 
		arrayValue2.push(csvData[j].VALUE_2); 
	}

	for (let i = 0; i < initialFeatures.length; i++) {
	  let newObject = {
	    NUTS_ID: initialFeatures[i].properties.NUTS_ID, 
	    LEVL_CODE: initialFeatures[i].properties.LEVL_CODE, 
	    NUTS_NAME: initialFeatures[i].properties.NUTS_NAME, 
	    NUTS0: initialFeatures[i].properties.NUTS0,
	    NUTS1: initialFeatures[i].properties.NUTS1,
	    NUTS2: initialFeatures[i].properties.NUTS2,
	    MY_ID: initialFeatures[i].properties.MY_ID
	  };

	  for (let j = 0; j < csvData.length; j++) {
	    csvIDs.push(csvData[j].MY_ID);
	    
	    // if the id from GeoJSON is found in the CSV
	    if (initialFeatures[i].properties.MY_ID === csvData[j].MY_ID) { 

	      // if the property exists
	      if (csvData[j].VALUE_1) {
	        newObject.VALUE_1 = csvData[j].VALUE_1; // append value
	      }
	      // if the property does not exist
	      else {
	        newObject.VALUE_1 = '';
	      }
	      // if the property exists
	      if (csvData[j].VALUE_2) {
	        newObject.VALUE_2 = csvData[j].VALUE_2; // append value
	      }
	      // if the property does not exist
	      else {
	        newObject.VALUE_2 = '';
	      }
	    }
	  }

	  // if the id from GeoJSON is found in the CSV
	  if (!csvIDs.includes(initialFeatures[i].properties.MY_ID)) {
	    newObject.VALUE_1 = ''; 
	    newObject.VALUE_2 = ''; 
	  }
	  
	  updatedProperties.push(newObject);
	}

	for (i = 0; i < updatedProperties.length; i++) {
	  for (j = 0; j < ro_NUTS_3.features.length; j++) {
	    if(ro_NUTS_3.features[i].properties.MY_ID === updatedProperties[j].MY_ID) {
	       // replace the feature's properties with updated values
	       ro_NUTS_3.features[i].properties = updatedProperties[j];
	       ro_NUTS_3_centroids.features[i].properties = updatedProperties[j];
	    }
	  }
	}
  
  // console.log("function mergeData() executed");
  callback();
}


// ---------------GENERAL FUNCTIONS ---------------

function chooseColorMacroReg(a) { 
  return	a === 'RO1' ? '#c3ecb2' : 
					a === 'RO2' ? '#aadaff' : 
					a === 'RO3' ? '#eb9dad' : 
					a === 'RO4' ? '#f6cf65' : 
			  						    '#ffffff' ; 
};

function chooseColorReg(a) { 
  return	a === 'Bucureşti-Ilfov' ? '#cf7a8b' : 
					a === 'Centru' ?          '#8fc777' : 
					a === 'Nord-Est' ?        '#aadaff' : 
					a === 'Nord-Vest' ?       '#c3ecb2' : 
					a === 'Sud-Est' ?         '#779ebd' : 
					a === 'Sud-Muntenia'    ? '#eb9dad' : 
					a === 'Sud-Vest Oltenia'? '#fce5a4' : 
					a === 'Vest' ?            '#f6cf65' : 										
			  						                '#ffffff' ; 
};

// showing Value 1 as circles
function setRadius(a) { 
  return	a > 801 ? 15 : 
					a > 601 ? 12 : 
					a > 401 ? 9 : 
					a > 201 ? 6 : 
			  						3 ; 
};

// showing Value 2 as choropleth
function chooseColor2(a) { 
  return	a > 400000 ? '#e93e3a' : 
					a > 300000 ? '#ed683c' : 
					a > 200000 ? '#f3903f' : 					
					a > 100000 ? '#fdc70c' : 
			  							 '#fff33b' ; 
};


// function to add a comma to separate thousands in large numbers
function thousandsSeparator(x) {
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
  return x;
}


// ---------------CREATE CONTENT ---------------
function createContent() {

// ---------------LEAFLET MAP ---------------
	
	// array of map layers 
	let layerList = [];

	// thematic layers for different admin levels
	let country;
	let allMacroRegiuni;
	let allRegiuni;
	let filtRegiuni;
	let allJudete;
	let allJudete1;
	let allJudete2;
	let filtJudete1;
	let filtJudete2;

	// text instructions that are updated as one uses the map
	let instructionsMap = document.getElementById("instructions");
	let initialInstructions = 
		'Hover to reveal information' + '<br>' + 
		'Or' + '<br>' +
		'Switch to another layer.';
	instructionsMap.innerHTML = initialInstructions;

	let map = L.map('map', {fullScreenControl: true, zoomSnap: 0.1});
	// map.setView([45.8, 25], startZoom);
	// this was replaced by map.fitBounds()
	map.fitBounds([
	  [48.342718, 20.079607], 
  	[43.462064, 29.923356]
	]);

	map.attributionControl.addAttribution('<a href="https://github.com/stefan-nicolescu">Stefan Nicolescu</a>');

	L.control.scale({metric: true, imperial: false, position: 'bottomright'}).addTo(map); 

	// fullscreen control
	const fsControl = L.control.fullscreen();
	map.addControl(fsControl);
		
	map.on('enterFullscreen', function() { });
	map.on('exitFullscreen', function() { });	

	// button to go to default view (full country)
	L.easyButton('<img src="images/home.png">',function(btn,map) {
  	map.fitBounds([
		  [48.342718, 20.079607], 
	  	[43.462064, 29.923356]
		]);
	},'Default View').addTo(map);

	let popupStyle = {
		'maxWidth':'300',
		'closeButton': false
	};

	function styleCountry(feature) {
		return {
			color: '#000000',
			fillColor: '#dddddd',
			fillOpacity: 1,
			opacity: 1,
			weight: 1      
		};
	};

	function styleMacroRegiuni(feature) {
		return {
			color: '#000000',
			fillColor: chooseColorMacroReg(feature.properties.NUTS_ID),
			fillOpacity: 1,
			opacity: 1,
			weight: 1      
		};
	};

	function styleRegiuni(feature) {
		return {
			color: '#000000',
			fillColor: chooseColorReg(feature.properties.NUTS_NAME),
			fillOpacity: 1,
			opacity: 1,
			weight: 1      
		};
	};


	function styleJudeteV2(feature) {
		return {
			color: '#000000',
			fillColor: chooseColor2(feature.properties.VALUE_2),
			fillOpacity: 1,
			opacity: 1,
			weight: 1      
		};
	};

	// same highlight style for all admin levels 
	function highlightFeature(e) {
	  let layer = e.target;

	  layer.setStyle({
			fillColor: '#787878'
	  });
	};

	function resetHighlightMacroReg(e) { 
		allMacroRegiuni.resetStyle(e.target);
	};

	function resetHighlightRegion(e) { 
		if (map.hasLayer(filtRegiuni)) {
			filtRegiuni.resetStyle(e.target);
		}
		if (map.hasLayer(allRegiuni)) {
			allRegiuni.resetStyle(e.target);
		}
	};

	function resetHighlightJudet(e) { 
		if (map.hasLayer(filtJudete1)) {
			filtJudete1.resetStyle(e.target);
		}	
		if (map.hasLayer(filtJudete2)) {
			filtJudete2.resetStyle(e.target);
		}	
		if (map.hasLayer(allJudete1)) {
			allJudete1.resetStyle(e.target);
		}
		if (map.hasLayer(allJudete2)) {
			allJudete2.resetStyle(e.target);
		}		
		if (map.hasLayer(allJudete)) {
			allJudete.resetStyle(e.target);
		}		
	};

	// go from Macro Regiuni to Regiuni 
	function drillDown(e) { 
		let regionBounds = e.target.getBounds();
		map.fitBounds(regionBounds);
		let clickedMacroRegion = e.target.feature.properties.NUTS_ID;

		// filter and add the new layer
		filtRegiuni = L.geoJson(ro_NUTS_2, {
		  style: styleRegiuni,
		  filter: function(feature, layer) {
		    if (feature.properties.NUTS1 === clickedMacroRegion) {
		    	return true;
		    }
		  },  
		  onEachFeature: onEachFeatRegiune
		}).addTo(map);

		layerList.push(filtRegiuni);

		// remove previous layer
		if(map.hasLayer(allMacroRegiuni)) {  
			map.removeLayer(allMacroRegiuni);
		}

		// change the legend
		map.removeControl(legendMacroRegions);
		legendRegions.addTo(map);

		// update instructions
		instructionsMap.innerHTML = 
			'Click on a Region to reveal its counties.'
		+ '<br>' + 'Or' + '<br>'
		+ 'Click on the Country to go back to Macro Regions';
	};


	// go from Regiuni to Macro Regiuni or
	// go from Judete to Macro Regiuni
	function drillUp(e) { 
		let countryBounds = e.target.getBounds();
		map.fitBounds(countryBounds);

		if(map.hasLayer(filtRegiuni)) {  
			map.removeLayer(filtRegiuni);
		}

		if(map.hasLayer(filtJudete1)) {  
			map.removeLayer(filtJudete1);
		}

		if(map.hasLayer(filtJudete2)) {  
			map.removeLayer(filtJudete2);
		}

		resetHighlightMacroReg(this);
		allMacroRegiuni.addTo(map);
	
		// change the legend
		map.removeControl(legendRegions);
		legendMacroRegions.addTo(map);

		// update instructions
		instructionsMap.innerHTML = initialInstructions;
	};


	function drillDown2(e) { 
		let regionBounds = e.target.getBounds();
		map.fitBounds(regionBounds);
		let clickedRegion = e.target.feature.properties.NUTS_ID;

		// filter and add the new layer
		filtJudete2 = L.geoJson(ro_NUTS_3, {
		  style: styleJudeteV2,
		  filter: function(feature, layer) {
		    if (feature.properties.NUTS2 === clickedRegion) {
		    	return true;
		    }
		  },  
		  onEachFeature: onEachFeatJudet1and2
		}).addTo(map);

		layerList.push(filtJudete2);

		// filter and add the new layer
		filtJudete1 = L.geoJson(ro_NUTS_3_centroids, {
			// onEachFeature: onEachMarker,
		  filter: function(feature, layer) {
		    if (feature.properties.NUTS2 === clickedRegion) {
		    	return true;
		    }
		  },  
		  pointToLayer: function (feature, latlng) {
		  	return L.circleMarker(latlng, 
		  		{
						radius: setRadius(feature.properties.VALUE_1),
						fillColor: "#000000",
						color: "#ffffff",
						weight: 2,
						opacity: 1,
						fillOpacity: 1,
						className: "fadded-add"
					});
		  }
		}).addTo(map);

		layerList.push(filtJudete1);

		// remove previous layers
		if(map.hasLayer(allMacroRegiuni)) {  
			map.removeLayer(allMacroRegiuni);
		}
		if(map.hasLayer(filtRegiuni)) {  
			map.removeLayer(filtRegiuni);
		}
		if(map.hasLayer(allRegiuni)) {  
			map.removeLayer(allRegiuni);
		}

		// change the legend
		map.removeControl(legendRegions);
		legendJudete2.addTo(map);
		legendJudete1.addTo(map);

		// update instructions
		instructionsMap.innerHTML = 
			'Hover a County for Information.'	+ '<br>' +
			 'Or' + '<br>' + 
			 'Click on the Country to go back to Macro Regions';
	};


	function onEachFeatCountry(feature, layer) {
		layer.on({
			click: drillUp
	  });
	};

	function onEachFeatMacroRegiune(feature, layer) {
	  let tooltipContent = '<p class="tooltip-text">' + feature.properties.NUTS_NAME + '</p>';

		layer.bindTooltip(tooltipContent, {
			className: 'tooltips-style'
		});	

		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlightMacroReg,
			click: drillDown
	  });
	};

	function onEachFeatRegiune(feature, layer) {
	  let tooltipContent = '<p class="tooltip-text">' + feature.properties.NUTS_NAME + '</p>';

		layer.bindTooltip(tooltipContent, {
			className: 'tooltips-style'
		});	

		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlightRegion,
			click: drillDown2
	  });
	};

	function onEachFeatJudet1(feature, layer) {
	  let tooltipContent = '<p class="tooltip-text">' + feature.properties.NUTS_NAME + '</p>' +
		'<p class="tooltip-text">Value 1: ' + feature.properties.VALUE_1 + '</p>';

		layer.bindTooltip(tooltipContent, {
			className: 'tooltips-style'
		});	

		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlightJudet
		});
	};


	function onEachFeatJudet2(feature, layer) {
	  let tooltipContent = '<p class="tooltip-text">' + feature.properties.NUTS_NAME + '</p>' +
		'<p class="tooltip-text">Value 2: ' + feature.properties.VALUE_2 + '</p>';

		layer.bindTooltip(tooltipContent, {
			className: 'tooltips-style'
		});	

		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlightJudet
	  });
	};

	function onEachFeatJudet1and2(feature, layer) {
	  let tooltipContent = '<p class="tooltip-text">' + feature.properties.NUTS_NAME + '</p>' +
		'<p class="tooltip-text">Value 1: ' + feature.properties.VALUE_1 + '</p>' +
		'<p class="tooltip-text">Value 2: ' + feature.properties.VALUE_2 + '</p>';

		layer.bindTooltip(tooltipContent, {
			className: 'tooltips-style'
		});	

		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlightJudet
	  });
	};

	// create the layers from GeoJSON
	country = L.geoJSON(ro_NUTS_0, {
		style: styleCountry,
		onEachFeature: onEachFeatCountry
	}).addTo(map);

	allMacroRegiuni = L.geoJSON(ro_NUTS_1, {
		style: styleMacroRegiuni,
		onEachFeature: onEachFeatMacroRegiune
	});

	allRegiuni = L.geoJSON(ro_NUTS_2, {
		style: styleRegiuni,
		onEachFeature: onEachFeatRegiune
	});

// display Value 1 as circles
	allJudete1 = L.geoJSON(ro_NUTS_3_centroids, {
		  pointToLayer: function (feature, latlng) {
		  	return L.circleMarker(latlng, 
		  		{
						radius: setRadius(feature.properties.VALUE_1),
						fillColor: "#000000",
						color: "#ffffff",
						weight: 2,
						opacity: 1,
						fillOpacity: 1,
						className: "fadded-add"
					});
		  },
		  onEachFeature: onEachFeatJudet1

	});

	// display Value 2 as choropleth
	allJudete2 = L.geoJSON(ro_NUTS_3, {
		style: styleJudeteV2,
		onEachFeature: onEachFeatJudet2
	}).addTo(map);


	// add layer control to switch between thematic layers
	let baseLayers = {
		"NUTS 1 - Macro Regiuni": allMacroRegiuni,
		"NUTS 2 - Regiuni": allRegiuni,
		"NUTS 3 - Judete - Value 1": allJudete1,
		"NUTS 3 - Judete - Value 2": allJudete2
	};
	let overlays = {
		// add layers here
	};

	L.control.layers(baseLayers,overlays, {collapsed: false, position: 'bottomleft'}).addTo(map);


	// legend for Macro Regions
	let legendMacroRegions = L.control({position: 'topright'});
	legendMacroRegions.onAdd = function (map) {
	  let div = L.DomUtil.create('div', 'info legend legend-regions');
	  div.innerHTML = 
	  		'<i style="background:' + '#c3ecb2' + '"></i> ' + 'RO1 - Macroregiunea 1' + '<br>'
	  	+ '<i style="background:' + '#aadaff' + '"></i> ' + 'RO2 - Macroregiunea 2' + '<br>'
	  	+ '<i style="background:' + '#eb9dad' + '"></i> ' + 'RO3 - Macroregiunea 3' + '<br>'
	   	+ '<i style="background:' + '#f6cf65' + '"></i> ' + 'RO4 - Macroregiunea 4';
	  return div;
	};

	// legend for Regions 
	let legendRegions = L.control({position: 'topright'});
	legendRegions.onAdd = function (map) {
	  let div = L.DomUtil.create('div', 'info legend legend-regions');
	  div.innerHTML = 
	   	  '<i style="background:' + '#c3ecb2' + '"></i> ' + 'RO11 - Nord-Vest' + '<br>'
	  	+ '<i style="background:' + '#8fc777' + '"></i> ' + 'RO12 - Centru' + '<br>'
	  	+ '<i style="background:' + '#aadaff' + '"></i> ' + 'RO21 - Nord-Est' + '<br>'
	  	+ '<i style="background:' + '#779ebd' + '"></i> ' + 'RO22 - Sud-Est' + '<br>'
	  	+ '<i style="background:' + '#eb9dad' + '"></i> ' + 'RO31 - Sud-Muntenia' + '<br>'
	  	+	'<i style="background:' + '#cf7a8b' + '"></i> ' + 'RO32 - Bucureşti-Ilfov' + '<br>'
	   	+ '<i style="background:' + '#fce5a4' + '"></i> ' + 'RO41 - Sud-Vest Oltenia' + '<br>'
	  	+ '<i style="background:' + '#f6cf65' + '"></i> ' + 'RO42 - Vest'; 	
	  return div;
	};

	// legend for counties by Value 1
	let legendJudete1 = L.control({position: 'topright'});
	legendJudete1.onAdd = function (map) {
	  let div = L.DomUtil.create('div', 'info legend legend1');
	    div.innerHTML = 
	  	  '<div class="circle-1"></div> ' + '<div class="text-1">800 - 1000</div>' + '<br>'
	  	+	'<div class="circle-2"></div> ' + '<div class="text-2">600 - 800</div>' + '<br>'
	  	+	'<div class="circle-3"></div> ' + '<div class="text-3">400 - 600</div>' + '<br>'
	  	+	'<div class="circle-4"></div> ' + '<div class="text-4">200 - 400</div>' + '<br>'
	  	+	'<div class="circle-5"></div> ' + '<div class="text-5">0 - 200</div>';
	  return div;
	};

	// legend for counties by Value 2
	let legendJudete2 = L.control({position: 'topright'});
	legendJudete2.onAdd = function (map) {
	  let div = L.DomUtil.create('div', 'info legend legend2');
	  div.innerHTML = 
	  		'<i style="background:' + '#e93e3a' + '"></i> ' + '400,000 - 500,000' + '<br>'
	  	+ '<i style="background:' + '#ed683c' + '"></i> ' + '300,000 - 400,000' + '<br>'
	  	+ '<i style="background:' + '#f3903f' + '"></i> ' + '200,000 - 300,000' + '<br>'
	   	+ '<i style="background:' + '#fdc70c' + '"></i> ' + '100,000 - 200,000' + '<br>'
	  	+ '<i style="background:' + '#fff33b' + '"></i> ' + '0 - 100,000';
	  return div;
	};

	// this legend is added to the map at startup
	// other legends are added alternatively when the thematic layer changes
	legendJudete2.addTo(map);

	// function to clear filtered layers previously loaded
	function clearLayers() {
		for (let i = 0; i < layerList.length; i++) {
			if (map.hasLayer(layerList[i])) {
				map.removeLayer(layerList[i]);
				// console.log("Removed layer")
			}
		}
	} 

	// switch between legends depending on what layer is displayed
	// legends are added/removed when the layer control is used
	// also, layers obtained through filterin are removed by clearLayers()
	map.on('baselayerchange', function (eventLayer) {

		// clear any previous layer obtained through filtering (drilldown)
		clearLayers();

		let currentLayer = eventLayer.name; 
		// the if condition test the name you gave to the layer in the layer control
		// the if condition does not test by layer name
		
		if (eventLayer.name === "NUTS 1 - Macro Regiuni") {
			this.removeControl(legendJudete1); // remove old legend
			this.removeControl(legendJudete2); // remove old legend
			this.removeControl(legendRegions); // remove old legend
			legendMacroRegions.addTo(this); // add new legend	

		}	else if (eventLayer.name === "NUTS 2 - Regiuni") {
			this.removeControl(legendJudete1); // remove old legend
			this.removeControl(legendJudete2); // remove old legend
			this.removeControl(legendMacroRegions); // remove old legend
			legendRegions.addTo(this); // add new legend	

		}	else if (eventLayer.name === "NUTS 3 - Judete - Value 1") {
			this.removeControl(legendRegions); // remove old legend
			this.removeControl(legendMacroRegions); // remove old legend
			this.removeControl(legendJudete2); // remove old legend
			legendJudete1.addTo(this); // add new legend

		} else if (eventLayer.name === "NUTS 3 - Judete - Value 2") {
			this.removeControl(legendRegions); // remove old legend
			this.removeControl(legendMacroRegions); // remove old legend		
			this.removeControl(legendJudete1); // remove old legend
			legendJudete2.addTo(this); // add new legend
		}

	});

	// control map zoom when the window is resized
	// bounds are defined as two poins that define a rectangle on a map 
	window.addEventListener('resize', function(event){	
		map.fitBounds([ [48.342718, 20.079607],[43.462064, 29.923356]] );
	});


// ---------------TABLE ---------------

	let divNewTable = document.getElementById("table-data"); // table container 
	document.getElementById("table-data").style.height = "auto";
	const tableHeaders = ["Id", "Judeţ", "Value 2"];

	let tableJudete = document.createElement("table") // create table element
	tableJudete.id = "table-judete"; // assign id to table
	let tr = tableJudete.insertRow(-1); // insert the first row
	  
	for (let i = 0; i < tableHeaders.length; i++){
	  let th = document.createElement("th"); // create the table headers       
	  tr.appendChild(th); // assign the headers in the first table row
	  // th.innerHTML = tableHeaders[i];
	  if (i === 1) { // set sorting function for column with county names
	  	th.outerHTML = "<th onclick=" + "sortTableAlphabetic(1)>" + tableHeaders[i] + "</th>"     
	  }
	  else {
	  	th.outerHTML = "<th onclick=" + "sortTable(" + i + ")>" + tableHeaders[i] + "</th>"     
		}
	}; 

	// use max to avoid empty fields
	let maxSize = Math.max(arrayIds.length, arrayNames.length, arrayValue1.length, arrayValue2.length);

	// populate each row with data
	// iterate in this odd way to show the most recent run first
	for (let i = 0; i < maxSize; i++) {
	  tr = tableJudete.insertRow(-1); // add table row              
	  let cell1 = tr.insertCell(-1); // create cell
	  cell1.innerHTML = arrayIds[i]; // add id to cell
	  let cell2 = tr.insertCell(-1); // create cell
	  cell2.innerHTML = arrayNames[i]; // add date to cell
	  let cell3 = tr.insertCell(-1); // create cell
	  cell3.innerHTML = arrayValue2[i]; // add distance to cell
	}

	divNewTable.innerHTML = ""; // empty the table before calling update
	divNewTable.appendChild(tableJudete); // write the table

	drawChart();

} 
// ---------------END OF CREATE CONTENT FUNCTION ---------------


// ---------------BAR CHART ---------------

// chart generated as a separate function because it will be redrawn at window size change
function drawChart() {

	// empty the container to generate chart with updated width
	document.getElementById("value-chart").innerHTML = "";

	// get the new width of the container that will hold the chart
	let chartContainerWidth = document.getElementById('chart-container').clientWidth;
	let chartWidth = chartContainerWidth - 20;

	// obtain the height of the table
	let tableHeight = document.getElementById('table-data').clientHeight;
	// assign the height of the chart to be equal to the height of the table 
	// remove 30px to account for the chart title
	let chartHeight = tableHeight - 30; // height of svg container for chart 
	
	// define chart data
	let dataChart = d3.zip(arrayIds, arrayNames, arrayValue2);

	// define y scale
	let yScale = d3.scaleBand()
					.domain(d3.range(arrayIds.length))
					.rangeRound([0, chartHeight])
					.round(true)
					.paddingInner(0.05);

	// define x scale
	let xScale = d3.scaleLinear()
					.domain([0, d3.max(arrayValue2)]) // +10 to show labels above
					.range([40, chartWidth]);		

	// create SVG element
	let svgSales = d3.select("#value-chart") // select by id
				.append("svg") // insert the <svg> inside the selected <div>
				.attr("width", chartWidth) // assign width
				.attr("height", chartHeight) // assign height
				.attr("id", "value-chart-svg"); // assign id	

	// create <g> for each month
	let sales = svgSales.selectAll('g.value-judet')
		.data(dataChart);
	let salesEnter = sales.enter()
	  .append('g')
	  .classed('value-judet', true);
	
	// create the <rect> elements
	salesEnter.append("rect")
	 .attr("y", function(d, i) {
	 		return yScale(i);
	 })
	 .attr("x", function(d) {
	 		return 0; // bars aligned to left
	 })
	 .attr("height", "26px")
	 .attr("width", function(d) {
	 		return xScale(d[2]); // -70 to position labels below chart
	 })
	 .attr("fill", function(d) {
	 		return chooseColor2(d[2]); // fill bars according to sales
	 });


	// labels for sales
	salesEnter.append("text")
	 .attr("class", "labels-value") // assign a CSS class
	 .text(function(d) {
	 		return thousandsSeparator(d[2]);
	 })
	 .attr("text-anchor", "middle")
	 .attr("x", 35)
	 .attr("y", function(d, i) {
	 		return yScale(i) + 17;
	 });

	// tooltips
	salesEnter.append("title")
		.text(function(d, i) {
			return thousandsSeparator(d[2]);
		});

	// sort chart bars by value
	function sortBarsValue() {

		// flip value of sortOrder
	 	// sortOrder = !sortOrder;

		// sort the rectangles (bars) of the bar chart 
		svgSales.selectAll("rect")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[2], b[2]);
		   		} else {
			   		return d3.descending(a[2], b[2]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i);
		   })

 		// sort the text labels of the bar chart
 		svgSales.selectAll("text")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[2], b[2]);
		   		} else {
			   		return d3.descending(a[2], b[2]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i) + 17;
		   });

 		// sort the tooltips of the bar chart
 		svgSales.selectAll("title")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[2], b[2]);
		   		} else {
			   		return d3.descending(a[2], b[2]);
		   		}
		   	})
		   .transition()
		   .duration(1000);

		// !!! very important to change sort order for next function to sort
		sortOrder = !sortOrder;
	};		

	// sort chart bars by county
	function sortBarsJudet() {

		// sort the rectangles (bars) of the bar chart 
		svgSales.selectAll("rect")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[1], b[1]);
		   		} else {
			   		return d3.descending(a[1], b[1]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i);
		   })

 		// sort the text labels of the bar chart
 		svgSales.selectAll("text")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[1], b[1]);
		   		} else {
			   		return d3.descending(a[1], b[1]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i) + 17;
		   });

 		// sort the tooltips of the bar chart
 		svgSales.selectAll("title")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[1], b[1]);
		   		} else {
			   		return d3.descending(a[1], b[1]);
		   		}
		   	})
		   .transition()
		   .duration(1000);

		// !!! very important to change sort order for next function to sort
		sortOrder = !sortOrder; 
	};	

	// sort chart bars by ids
	function sortBarsId() {

		// sort the rectangles (bars) of the bar chart 
		svgSales.selectAll("rect")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[0], b[0]);
		   		} else {
			   		return d3.descending(a[0], b[0]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i);
		   })

 		// sort the text labels of the bar chart
 		svgSales.selectAll("text")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[0], b[0]);
		   		} else {
			   		return d3.descending(a[0], b[0]);
		   		}
		   	})
		   .transition()
		   .duration(1000)
		   .attr("y", function(d, i) {
		   		return yScale(i) + 17;
		   });

 		// sort the tooltips of the bar chart
 		svgSales.selectAll("title")
		   .sort(function(a, b) {
		   		if (sortOrder) {
			   		return d3.ascending(a[0], b[0]);
		   		} else {
			   		return d3.descending(a[0], b[0]);
		   		}
		   	})
		   .transition()
		   .duration(1000);

		// !!! very important to change sort order for next function to sort
		sortOrder = !sortOrder;
	};	

	// select HTML elements using D3 to assign the sort functions
	// select the chart header using d3
	let chartHeader = d3.select("#chart-title");
	// select the second of the headers (for id sort)
	let tableHeaderIds= d3.selectAll("th").filter(":first-child");
	// select the second of the headers (for zip code sort)
	let tableHeaderJudet = d3.selectAll("th").filter(":nth-child(2)");
	// select the last of the headers (for sales sort)
	let tableHeaderValue2 = d3.selectAll("th").filter(":last-child");

	// assign the sorting function to the table ids header
	tableHeaderIds.on("click", function() {
		sortBarsId();
	})	

	// assign the sorting function to the table zips header
	tableHeaderJudet.on("click", function() {
		sortBarsJudet();
	})	

	// assign the sorting function to the table sales header
	tableHeaderValue2.on("click", function() {
		sortBarsValue();
	})	

}


// !!! force the order of function execution
getCSV(function() {
  mergeData(function() {
    	createContent(function(){
    });
  });
});


let sortOrder = true;

// sort table numerically
function sortTable(n) {
  let tableJudete = document.getElementById("table-judete");
  let switchcount = 0;
  let switching = true;
  // let dir = "asc"; 
  let shouldSwitch = true;
  let i;          

  while (switching) {
    switching = false;
    let rows = tableJudete.rows;

    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      let x = rows[i].getElementsByTagName("TD")[n];
      let y = rows[i + 1].getElementsByTagName("TD")[n];
      if (sortOrder == true) {
        if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
          shouldSwitch = true;
          break;
      }


      } else if (sortOrder == false) {
        if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
          shouldSwitch = true;
          break;
        }
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount ++;      
    } else {
      if (switchcount == 0 && sortOrder == true) {
        sortOrder = false;
        switching = true;
      }
    }
  }

// console.log(sortOrder);

}

//sort table alphabetically (for string types)
function sortTableAlphabetic(n) {
  let tableJudete = document.getElementById("table-judete");
  let switchcount = 0;
  let switching = true;         
  let dir = "asc"; //Set the sorting direction to ascending
  let shouldSwitch = true;
  let i;

  //loop until no switching has been done   
  while (switching) {           
    switching = false; //at start, no switching is done
    let rows = tableJudete.rows;
    
    //loop through all table rows (except the table headers
    for (i = 1; i < (rows.length - 1); i++) { 
      shouldSwitch = false; //no switch 
      let x = rows[i].getElementsByTagName("TD")[n]; //first element to compare
      let y = rows[i + 1].getElementsByTagName("TD")[n]; //second element to compare
        
        //check if the two rows should switch place, based on the direction, asc or desc
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop
          shouldSwitch = true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]); //make switch
      switching = true;             
      switchcount ++; //increment for each switch   
    } else {
      //if no switching has been done AND the direction is "asc"
      //set the direction to "desc" and run the while loop again.
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}


// when the window is resized the chart is redrawn to strecth the bars to fill the space
window.addEventListener('resize', drawChart);

