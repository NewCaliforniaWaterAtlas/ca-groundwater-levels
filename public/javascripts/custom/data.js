var date_start = '1/1/2011', date_end = '12/31/2012', increment = 365, limit = 50, latitude = 38.7647, longitude = -121.8404;

var path = 'http://localhost:3000/watertable/v1/depth?' 
  /*   + '&latitude=' + latitude  */
  /*   + '&longitude=' + longitude  */
    + '&limit=' + limit 
    + '&increment=' + increment 
    + '&date_start=' + date_start 
    + '&date_end=' + date_end 
  /*   + '&depth=true' */
 /*    + '&county=' + county; */


var context = cubism.context()
    .serverDelay(new Date(2012, 4, 2) - Date.now())
    .step(864e5)
    .size(1280)
    .stop();

d3.select("#demo").selectAll(".axis")
    .data(["top", "bottom"])
  .enter().append("div")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());

var nest;
var row;
// Load all data.
d3.json(path, function(rows) {
  row = rows[0]; // for now just get the first item of the datacube
  nest  = d3.nest()
    .key(function(d) { return d.properties.county; })
    .key(function(d) { return d.id; })
    .map(row, d3.map); // organize the object by county and well
    
    //console.log(nest);
    for(county in nest) {
    
        // Insert County Name.
        d3.select("body")
        .data(county)
        .append("div").text(county);
  

        var wellKeys = nest[county].keys(); // Build list of the wells in a county.
        var wellMap = wellKeys.map(wells); // Map each well in the list of wells by county. Return visualized data for that well over time. Is a list of wells in a county.


      for(well in nest[county]){
        d3.select("body")/* .selectAll(".horizon") */
          .data(wellMap) // Map data by well keys (names of counties)
          .append("div")
            .attr("class", "horizon")
            .call(context.horizon()
              .format(d3.format("+,.2p")))
      }
    }

});




context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});

function wells(well) {
  return context.metric(function(start, stop, step, callback) {
  var values = [1,2,3,4];

  // convert start & stop to milliseconds
  start = +start;
  stop = +stop;

  while (start < stop) {
    start += step;
    values.push(1);
  }

  callback(null, values);
  }, well);
}

function wells2(well) {
  console.log(well);
  //var format = d3.time.format("%d-%b-%y");
  // We want to build a horizon chart for the well data for a particular well in a county. (I think)
  // …We want to represent well levels over time by county. A simple chart will do.
  // We have the id of the well. We are iterating through the county list.
  // We need to plot values by well.
  // First let's start with the well ID.
  
  // Look up the well in the list of wells.
/*
      wellData = row.filter(function(d, well) { //console.log(d.id); 
      console.log(d.id)
      //row[d]['id'] = well
      return "test"//d.id = well; 
      
      }); 
*/

    return well;
/*
  return context.metric(function(start, stop, step, callback) {

      

      wellData = row.filter(function(d, well) { //console.log(d.id); 
      
      console.log(row[well]); 
      return row[well]//d.id = well; 
      
      }); 
      console.log(wellData);
      rows = wellData.map(function(d) { 
          return [format.parse(d.properties.date), +d.properties.gs_to_ws]
                 .filter(function(d) { return d[1]; }).reverse();

          var date = rows[0][0], 
              compare = rows[limit - 1][1], 
              value = rows[0][1], 
              values = [value];
  
          rows.forEach(function(d) {
            while ((date = d3.time.day.offset(date, 1)) < d[0]) values.push(value);
            values.push(value = (d[1] - compare) / compare);
          });
          callback(null, values.slice(-context.size()));
          });
          

  }, name);
*/
}