// calculate the total distance for a linestring
// uses the distance function from turf.js
function dist(coords){
    
    // variables for total and current distance
    var totDist = 0;
    var curDist = 0;
    
    // loop through all coordinates points  
    for(var i=0; i<(coords.length-1); i++){
        
        // calculate distance between current point and last point
        curDist = turf.distance(coords[i], coords[i+1])
        
        // add current distance to previous distances 
        totDist = totDist + curDist;
    }
    // return total distance, rounded to the nearest km
    return(Math.round(totDist));
}

// calculate the total duration of tracking time (in days)
function duration(selected){
    
    //get the total number of points 
    var len = selected.length; 
    
    // get the first timestamp
    var date1 = new Date(selected[0].properties.timestamp)
    
    // get the last timestamp
    var date2 = new Date(selected[len-1].properties.timestamp)

    // To calculate the time difference of two dates
    // https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
    var diff = date2.getTime() - date1.getTime(); 

    // To calculate the no. of days between two dates 
    var days = diff / (1000 * 3600 * 24); 
    
    // return the total number of days, rounded to nearest day
    return(Math.round(days))
}

// create an SVG rectangle
function createRect(divid, width, update){
    
    // if we are updating, rather than creating something new 
    if(update == true){
        // remove the existing svg in the div 
        d3.selectAll(divid + ' > svg').remove();    
    }
    
    var svg = d3.select(divid).append("svg").attr("width", 100).attr("height", 30)

    // Outside rectangle
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 100)
      .attr('height', 20)
      .attr('fill', '#5e6f52')
      .attr('stroke', '#C9C19F')
      .style("fill", "url(#circles-1)")
      .style("opacity", 0.5);
    
    // Inside rectangle fill
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', 20)
      .attr('fill', '#C9C19F')
      .attr('stroke', '#C9C19F')
      .style("opacity", 0.5);
}

// update the map by cutting the coordinates array     
function updateMap(newtime, data){
    
    // cut the coordinates based on the time input 
    newData = data.slice(0, newtime);
    
    // new data to add to the map
    data = {
    'type': 'Feature',
    'properties': {},
    'geometry': {
    'type': 'LineString',
    'coordinates': newData
    }}
    
    // update the data on the map
    map.getSource('route').setData(data);

}

// convert numeric time to something more quickly readable
function convertDate(date){
    var months = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
    
    var month = date.split("-")[1];
    var year = date.split("-")[0];
    var newMonth = months[parseInt(month)-1];
    var newDate = newMonth + " " + year; 
    
    return(newDate);
}

mapboxgl.accessToken = 'pk.eyJ1IjoiaGFubmFoa2VyIiwiYSI6ImNpdHEzcndkajAwYmwyeW1zd2UxdTAwMnMifQ.hYglJOOC0Mhq7xNYOxc6qg';
    
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/hannahker/ck739u5hk22zj1iqwceb1pb5l',
    center: [-123.116226, 49.246292],
    zoom: 4
});

// ------------------------------------------------ WHEN THE MAP LOADS
map.on('load', function() {
    
        // add scale bar to the map
        map.addControl(new mapboxgl.ScaleControl());
       
        // ** help from class tutorial: example here https://docs.mapbox.com/mapbox-gl-js/example/live-update-feature/
        d3.json('eagles.geojson', function(err, data) {         
            
            if (err) throw err;
        
            // create empty rectangles 
            createRect('#rect1', 0, false)
            createRect('#rect2', 0, false)
            createRect('#rect3', 0, false)
            
            // ------------------------------------------------ WHEN USER SELECTS AN EAGLE
            document.getElementById("eagle").onchange = function() {
                
                // this won't work the first time because there will be nothing to remove
                // remove the data that was previously on the map
                try {
                    map.removeLayer('route')
                    map.removeSource('route')
                }
                catch(error) {
                    console.error;
                }
                
                // get the selected text from the dropdown menu
                var e = document.getElementById("eagle");
				var result = e.options[e.selectedIndex].text;
                
                // select only the data for one eagle
                var selected = []              
                for(var i=0; i<data.features.length; i++){
                    if(data.features[i].properties.comments == result){
                        selected.push(data.features[i])
                    }
                }
                
                // loop through all elements to get coordinates list for that eagle
                var coordinates = []
                for(var i = 0; i<selected.length; i++){
                   coordinates.push(selected[i].geometry.coordinates)    
                }
                
                console.log('Before: ' + document.getElementById('slider').value)
                // update the parameters for the timeslider based on the selected data
                document.getElementById("slider").setAttribute("max", selected.length);
                document.getElementById("slider").setAttribute("value", selected.length);
                //console.log('Length: ' + selected.length);
                console.log('After: ' + document.getElementById('slider').value)
                //console.log('Max: ' + document.getElementById('slider').max)
                
                // calculate variables for the eagle's movement 
                var totalDistance = dist(coordinates);
                var totalDuration = duration(selected);
                var start = selected[0].properties.timestamp.split(' ')[0];
                var end = selected[selected.length-1].properties.timestamp.split(' ')[0];
                
                // trying to convert to the month name 
                //var date = selected[0].properties.timestamp;
                //const month = date.toLocaleString('default', { month: 'long' });

                // writing the time to the div 
                document.getElementById('starttime').innerHTML = convertDate(start);
                document.getElementById('endtime').innerHTML = convertDate(end);
                
                // change the text for each rectangle div 
                document.getElementById('data1').innerHTML = totalDistance + ' km total distance';
                document.getElementById('data2').innerHTML = totalDuration + ' days total duration';
                document.getElementById('data3').innerHTML = Math.round(totalDistance/totalDuration) + ' km per day average';

                // fill the empty rectangles with values for the selected eagle
                createRect('#rect1', totalDistance/13376*100, true);
                createRect('#rect2', totalDuration/764*100, true);
                createRect('#rect3', (totalDistance/totalDuration)/22*100, true);

                // add the selected data to the map
                map.addSource('route', {
                    'type': 'geojson',
                    'lineMetrics': true,
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                        }
                    }
                });
                map.addLayer({
                    'id': 'route',
                    'type': 'line',
                    'source': 'route',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': '#C9C19F',
                            'line-width': 2,
                            'line-opacity': 0.6
                        }

                });               
                
                // zoom to the bounds of the selected data
                // from https://docs.mapbox.com/mapbox-gl-js/example/zoomto-linestring/
                var bounds = coordinates.reduce(function(bounds, coord) {
                    return bounds.extend(coord);
                    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
                map.fitBounds(bounds, {
                    padding: 20
                });  
                
                // help from https://docs.mapbox.com/mapbox-gl-js/example/timeline-animation/
                // update the data on the map by time 
                // ------------------------------------------------ WHEN THE SLIDER IS MOVED 
                document.getElementById('slider').addEventListener('input', function(e) {
                    updateMap(e.target.value, coordinates);
                    
                    });  
                
            };
            
        });   
});