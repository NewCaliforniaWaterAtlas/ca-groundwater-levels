$('.datepicker').datepicker({
    format: 'mm-dd-yyyy'
});



var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([37.5, -118], 6);

var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});

map.addLayer(layer);

d3.json('../../data/topojson/dwr_basin_boundaries.json', function(error, data) {
  var basins = topojson.feature(data, data.objects.database);          
  layer.addData(basins);
})
