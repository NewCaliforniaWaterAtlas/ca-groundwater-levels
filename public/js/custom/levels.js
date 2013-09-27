var address = '1400 Tenth St., Sacramento, CA, 95814';
var latitude = 37.000;
var longitude = -122.000;
var date_start = '7/1/2011';
var date_end = '7/1/2012';
var interval = 90;
var limit = 1000;
var format = 'json';
var apiPath = '/api/v1?';

var labelPaddingX = 8;
var labelPaddingY = 12;

// Load map
var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([latitude, longitude], 6);

// Make aquifer layer.
var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
map.addLayer(layer);


// Load aquifers (topoJSON)
/* Initialize the SVG layer */
map._initPathRoot()     

var query = 
          //'latitude='  + latitude
          //+ '&longitude=' + longitude
          //+ "&" +
          'limit=' + limit
          + '&interval=' + interval
          + '&date_start=' + date_start
          + '&date_end=' + date_end
          + '&format=' + format;

var wellsQuery = apiPath + query;
console.log(wellsQuery);
var averagesQuery = apiPath + query + '&averages=' + "true";

/* var color_range = ["#33838e", "#a1dde5", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]; */
var color_range = ["#33838e", "#a1dde5", "#efefef", "#ff7d73", "#ff4e40", "#ff1300"];

  var color_domain = [-100, -50, 0, 50, 100]
  var ext_color_domain = [-150, -100, -50, 0, 50, 100]
  var legend_labels = ["< -150", "-100", "-50", "0", "50", "> 100"]   
var color = d3.scale.threshold()
.domain(color_domain)
.range(color_range.reverse());

queue()
    .defer(d3.json, "./../data/topojson/dwr_basin_boundaries.json")
    .defer(d3.json, averagesQuery)
/*     .defer(d3.json, wellsQuery) */
    .await(ready);


function ready(error, aquifers, averages, wells) {
  differences = processDifferences(averages,0);
  buildSubBasins(aquifers, differences, wells, 0);
};

function buildSubBasins(data, differences, wells, int) {
  var basins = topojson.feature(data, data.objects.database);
  /* Define the d3 projection */

  var path = d3.geo.path().projection(function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  });
  
 // layer.addData(basins);

  var svg = d3.select("#map").select("svg");
  var b = svg.append("g").attr("class", "basins");

  var basinsSVG = b.append("g")
  .attr("class", "basin")
  .selectAll("path")
  .data(basins.features)
  .enter().append("path")
  .attr("d", path)
  .style("fill", function(d) {
    if(d.id !== undefined){
      if(differences[d.id] !== undefined){
        var change = differences[d.id].change;
      }
      else {
        var change = 0;
      }
    }
    return color(change);
  })
  .style("opacity", 0.8);


  var basinLabel = b.selectAll("text")
    .data(basins.features)
    .enter()
    .append("svg:text")
    .text(function(d){
      if(d.id !== undefined){
        if(differences[d.id] !== undefined){
          var change = differences[d.id].change;
                return Math.floor(change);
        }
    }
  })
  .attr("x", function(d){
      return path.centroid(d)[0];
  })
  .attr("y", function(d){
      return  path.centroid(d)[1];
  })

 
  var width = 960,
  height = 300;
  var ls_w = 20, ls_h = 20;
  
  var legend = d3.select("#map").select("svg");
  var legendGroup = svg.append("g").attr("class", "legend");
    
  var legendSVG = legendGroup.selectAll(".legend")
  .data(ext_color_domain)
  .enter().append("g")
  .attr("class", "legend-item");

  legendSVG.append("rect")
  .attr("x", 20)
  .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d, i) { return color(d); })
  .style("opacity", 0.8);

  legendSVG.append("text")
  .attr("x", 50)
  .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
  .text(function(d, i){ return legend_labels[i]; });
  

/*
  var wellsLayer = d3.select("#map").select("svg");
  var wellsGroup = svg.append("g").attr("class", "wells");
  
  var well = wellsGroup.selectAll("path")
    .data(wells[int])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "well");

  var wellLabel = wellsGroup.selectAll("text")
    .data(wells[int])
    .enter()
    .append("svg:text")
    .text(function(d){
            if(d.properties.gs_to_ws !== undefined) {
      return Math.floor(d.properties.gs_to_ws);
      }
  })
  .attr("x", function(d){
      return path.centroid(d)[0] + labelPaddingX;
  })
  .attr("y", function(d){
      return  path.centroid(d)[1] + labelPaddingY;
  })
  .attr("class","well-label");
*/


  map.on("viewreset", function reset() {

      basinsSVG.attr("d",path);

       basinLabel.attr("x", function(d){
          return path.centroid(d)[0];
        });
        
        basinLabel.attr("y", function(d){
            return  path.centroid(d)[1];
        });  

/*
      
      var zoom  = map.getZoom();
      
      if(zoom > 8) {
      
        well.attr("d",path);
   
        wellLabel.attr("x", function(d){
          return path.centroid(d)[0] + labelPaddingX;
        });
        
        wellLabel.attr("y", function(d){
            return  path.centroid(d)[1] + labelPaddingY;
        });      

      }
      else {
        d3.selectAll(".well")
          .remove();
          
        d3.selectAll(".well-label")
          .remove();
      }
*/
      
  });

};

function processDifferences(data,int) {
  // Build list of differences from one interval to the next (where they match)
  var int = 0;
  var differences = [];

  // Map of the two intervals.
  var data0 = d3.map(data[int]);
  var data1 = d3.map(data[int+1]);

  // Current map (start date)
  d0 = data[int].map(function(d){    
    if(d._id !== undefined && d._id !== null && d._id !== ''){
      
      id_upper = d._id.toUpperCase();


      d1 = data[int+1].filter(function(g){
        if(d._id == g._id){
          return g;
        }
      })[0];
  
      if(d1 !== undefined) {
        differences[id_upper] = {
          start: d.averageGStoWS,
          change:  d1.averageGStoWS - d.averageGStoWS,
          end: d1.averageGStoWS
        };  
      }

    }
  });

  return differences;  
};



/* We simply pick up the SVG from the map object */
/*
var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "wells");

*/



/* Load and project/redraw on zoom */



function showWells(data, int) {

    if(data.length > 1) {
      if(data[int].length > 1){
  
      var feature = g.selectAll("path")
        .data(data[int])
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "well");
  
      var featureLabel = g.selectAll("text")
        .data(data[int])
      .enter()
      .append("svg:text")
      .text(function(d){
          return Math.floor(d.gs_to_ws) + " " + d.properties.gw_basin_name;
      })
      .attr("x", function(d){
          return path.centroid(d)[0] + labelPaddingX;
      })
      .attr("y", function(d){
          return  path.centroid(d)[1] + labelPaddingY;
      })
      .attr("class","well-label");
   
  
    map.on("viewreset", function reset() {
      feature.attr("d",path)
     
      featureLabel.attr("x", function(d){
          return path.centroid(d)[0] + labelPaddingX;
      })
      featureLabel.attr("y", function(d){
          return  path.centroid(d)[1] + labelPaddingY;
      })
    })

  }}
}





$( "#datepicker-start" ).datepicker();
$( "#datepicker-end" ).datepicker();
$( "#slider" ).slider({
      value:100,
      min: 0,
      max: 500,
      step: 50,
      slide: function( event, ui ) {
        $( "#amount" ).val( "$" + ui.value );
      }
    });
$( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
    


// Geocode address.
// http://www.gisgraphy.com/documentation/user-guide.htm#geocodingwebservice

// on submit
// get address
// geocode it
// get lat lon
// get current date range
// default interval - 365
// construct search query
// get back results
// start map at the beginning

// plot wells
// add numbers to wells
// by subbasin, construct average number
// plot color
// set color of aquifer

// on change time slider, load selected interval
// update map


