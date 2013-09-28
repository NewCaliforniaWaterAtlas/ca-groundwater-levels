var levels = {}, map;

levels.address = '1400 Tenth St., Sacramento, CA, 95814';
levels.latitude = 37.000;
levels.longitude = -120.000;
levels.date_start = '7/1/2009';
levels.date_end = '7/1/2011';
levels.interval = 6;
levels.limit = 1000;
levels.format = 'json';
levels.apiPath = '/api/v1?';
levels.labelPaddingX = 8;
levels.labelPaddingY = 12;
levels.currentInterval = 0;
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

levels.buildMap = function() {
  // Load map
  map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([levels.latitude, levels.longitude], 6);
  
  // Make aquifer layer.
  var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
  map.addLayer(layer);
  
  /* Initialize the SVG layer */
  map._initPathRoot()     
  
  levels.query = 
            //'latitude='  + latitude
            //+ '&longitude=' + longitude
            //+ "&" +
            'limit=' + levels.limit
            + '&interval=' + levels.interval
            + '&date_start=' + levels.date_start
            + '&date_end=' + levels.date_end
            + '&format=' + levels.format;
  
  levels.wellsQuery = levels.apiPath + levels.query;
  console.log(levels.wellsQuery);
  levels.averagesQuery = levels.apiPath + levels.query + '&averages=' + "true";
  
  
  // http://bl.ocks.org/KoGor/5685876
  levels.color_range = ["#33838e", "#a1dde5", "#efefef", "#ff7d73", "#ff4e40", "#ff1300"];
  
  levels.color_domain = [-50, -25, 0, 25, 50]
  levels.ext_color_domain = [-100, -50, -25, 0, 25, 50]
  levels.legend_labels = ["< -100", "-50", "-25", "0", "25", "> 50"]   
  levels.color = d3.scale.threshold()
  .domain(levels.color_domain)
  .range(levels.color_range.reverse());
  
  queue()
      .defer(d3.json, "./../data/topojson/dwr_basin_boundaries.json")
      .defer(d3.json, levels.averagesQuery)
  /*     .defer(d3.json, levels.wellsQuery) */
      .await(levels.display);
};

levels.setupInterface = function() {
  $('.date-start').val(levels.date_start);
  $('.date-end').val(levels.date_end);

  $( "#datepicker-start" ).datepicker();
  $( "#datepicker-end" ).datepicker();
};

levels.updateInterface = function() {

  labels = [];
  for(var i in levels.dates) {
    d = moment(levels.dates[i]).format("MM/DD/YYYY");
    labels.push(d);
  }
  labels.pop();
  labels.shift();
  console.log(labels);

  if ((levels.numberIntervals - 2) > 0) {
    $('#slider').labeledslider({ 
      max: levels.numberIntervals - 2, 
      tickInterval: 1,
      tickLabels: labels,
      slide: function(event, ui) { 
        levels.currentInterval = ui.value;
        levels.loadInterval();
      }
    }); 
  }
};

levels.display = function(error, aquifers, averages, wells) {

  levels.aquifers = aquifers;
  levels.averages = averages.results;
  levels.numberIntervals = levels.averages.length;
/*   levels.wells = wells.results; */
  levels.dates = averages.query.dates;

  levels.differences = levels.processDifferences(levels.averages, levels.currentInterval);
  levels.buildSubBasins(levels.aquifers, levels.differences, levels.wells, levels.currentInterval);
  levels.updateInterface();
};


levels.loadInterval = function() {
  levels.differences = levels.processDifferences(levels.averages,levels.currentInterval);
  levels.buildSubBasins(levels.aquifers, levels.differences, levels.wells, levels.currentInterval);
};

levels.buildSubBasins = function(data, differences, wells, int) {
    var basins = topojson.feature(data, data.objects.database);

    var path = d3.geo.path().projection(function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  });
  
  // Clear existing data.
  d3.select(".basins").remove("g");


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
    return levels.color(change);
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
  .data(levels.ext_color_domain)
  .enter().append("g")
  .attr("class", "legend-item");

  legendSVG.append("rect")
  .attr("x", 20)
  .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d, i) { return levels.color(d); })
  .style("opacity", 0.8);

  legendSVG.append("text")
  .attr("x", 50)
  .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
  .text(function(d, i){ return levels.legend_labels[i]; });
  

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
      return path.centroid(d)[0] + levels.labelPaddingX;
  })
  .attr("y", function(d){
      return  path.centroid(d)[1] + levels.labelPaddingY;
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



levels.processDifferences = function(data,int) {
  // Build list of differences from one interval to the next (where they match)
  var int = levels.currentInterval;
  console.log(int);
  var differences = [];

  console.log(data);

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

levels.showWells = function(data, int) {

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
          return path.centroid(d)[0] + levels.labelPaddingX;
      })
      .attr("y", function(d){
          return  path.centroid(d)[1] + levels.labelPaddingY;
      })
      .attr("class","well-label");
   
  
    map.on("viewreset", function reset() {
      feature.attr("d",path)
     
      featureLabel.attr("x", function(d){
          return path.centroid(d)[0] + levels.labelPaddingX;
      })
      featureLabel.attr("y", function(d){
          return  path.centroid(d)[1] + levels.labelPaddingY;
      })
    })

  }}
};



levels.setupInterface();
levels.buildMap();



/*

    $(function() {
        slider = $('#slider').slider({
          animate: true,
          range: false,
          step: 3,
          value: startDate,
          max: daysDiff(minDate, maxDate),
          slide: function(event, ui) { resync(ui.values); }
        });
*/
/*
        
        startDate = $('#datepicker-start').datepicker({
            minDate: new Date($('.date-start').val()), 
            maxDate: maxDate,
            onSelect: function(dateStr) { resync(); }}).keyup(function() { resync(); });
*/
/*

        endDate = $('#datepicker-end').datepicker({
            minDate: minDate, 
            maxDate: maxDate,
            onSelect: function(dateStr) { resync(); }}).keyup(function() { resync(); });
*/
/*


        });

        function resync(values) {
*/
/*
            if (values) {
                var date = new Date(minDate.getTime());
                date.setDate(date.getDate() + values[0]);
                startDate.val($.datepicker.formatDate('mm/dd/yy', date));
                date = new Date(minDate.getTime());
                date.setDate(date.getDate() + values[1]);
                //endDate.val($.datepicker.formatDate('mm/dd/yy', date));
            }
            else {
                var start = daysDiff(minDate, startDate.datepicker('getDate') || minDate);
                var end = daysDiff(minDate, endDate.datepicker('getDate') || maxDate);
                start = Math.min(start, end);
                slider.slider('values', 0, start);
                slider.slider('values', 1, end);
            }
            //startDate.datepicker('option', 'maxDate', endDate.datepicker('getDate') || maxDate);
            //endDate.datepicker('option', 'minDate', startDate.datepicker('getDate') || minDate);
*/
/*
        }
        
        function daysDiff(d1, d2) {
            return  Math.floor((d2.getTime() - d1.getTime()) / 86400000);
        }
*/