// This example uses the autocomplete feature of the Google Places API.
// It allows the user to find all hotels in a given place, within a given
// country. It then displays markers for all the hotels returned,
// with on-click details for each hotel.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map, places, infoWindow, radius;

var markers = [];
var circles = [];
var autocomplete, autocomplete_su;
var d;
var countryRestrict = {
    'country': 'us'
};
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');
// var radToZoom = {
//   500: 16,
//   1000: 16,
//   1500: 15,
//   2000: 15,
//   2500: 15,
//   3000: 14,
//   3500: 14,
//   4000: 13,
//   4500: 13,
//   5000: 13
// }
var radToZoom = {
    321: 17,
    805: 16,
    1610: 15,
    // 2414: 15,
    // 3219: 15,
}
document.getElementById("mylocation").onclick = function (e) {
    $('#overlay2').fadeIn();
    document.getElementById('autocomplete').value = "";
    getLocation();
}

document.getElementById("search_button").onclick = function (e) {
    search();
}
$(".star.glyphicon").click(function () {
    $(this).toggleClass("glyphicon-star glyphicon-star-empty");
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: {
            lat: 42.3429,
            lng: -71.1003
        }, // Toronto by default
        mapTypeControl: false,
        panControl: false,
        zoomControl: false,
        // draggable: false,
        mapId: "9263d219add44f90",
        streetViewControl: false,
    });


    infoWindow = new google.maps.InfoWindow({
        content: document.getElementById('info-content')
    });

    // Create the autocomplete object and associate it with the UI input control.
    // Restrict the search to the default country, and to place type "cities".
    autocomplete_su = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */
        (
            document.getElementById('autocomplete_su')), {});
    autocomplete = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */
        (
            document.getElementById('autocomplete')), {});
    places = new google.maps.places.PlacesService(map);
    //
    radius = document.getElementById('radius')

    autocomplete.addListener('place_changed', onPlaceChanged);
}

function getUserPlace() {
    return autocomplete_su.getPlace();
}

// When the user selects a city, get the place details for the city and
// zoom the map in on the city.
function onPlaceChanged() {
    var place = autocomplete.getPlace();
    if (place.geometry) {
        map.setCenter(place.geometry.location);
    } else {
        document.getElementById('autocomplete').placeholder = 'Where do you want to eat?';
    }
}

function getRadius() {
    var rad = document.getElementById("radius");
    return rad.options[rad.selectedIndex].value;
}

function getKeyword() {
    var rad = document.getElementById("category");
    return rad.options[rad.selectedIndex].value;
}

function getOpenNow() {
    return document.getElementById("openbox").checked;
}

// Search for restaurants in the selected city, within the viewport of the map.
function search() {
    var rad = document.getElementById("radius");
    map.setZoom(radToZoom[getRadius()]);
    var search = {
        location: map.getCenter(),
        radius: getRadius(),
        keyword: getKeyword(),
        openNow: getOpenNow(),
        types: ['restaurant', 'meal_delivery', 'meal_takeaway', 'bakery', 'bar', 'cafe']
    };

    var lat = map.getCenter().lat()
    var lng = map.getCenter().lng()

    d = new Date();
    var timestamp = d.getTime()/1000 + d.getTimezoneOffset() * 60 // Current UTC date/time expressed as seconds since midnight, January 1, 1970 UTC

    $.ajax({
      url:"https://maps.googleapis.com/maps/api/timezone/json?location="+lat+","+lng+"&timestamp="+timestamp+"&key=AIzaSyC6ulIphxoU-FqarA8UkvxD58D-lR2JO9M",
    })
    .done(function(response){
       if(response.timeZoneId != null){
        var offsets = response.dstOffset * 1000 + response.rawOffset * 1000 // get DST and time zone offsets in milliseconds
Â Â Â Â Â Â Â Â Â Â Â Â d = new Date(timestamp * 1000 + offsets) // Date object containing current time of Tokyo (timestamp + dstOffset + rawOffset)
       }
    });

    places.nearbySearch(search, function (results, status) {
        var day = d.getDay() - 1;
        if (day == -1) {
            day = 6;
        }
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            $('#overlay1').fadeIn();
            if (document.getElementById("result_description") != null) {
                document.getElementById("result_description").style.display = "none";
            }

            clearResults();
            clearMarkers();
            // Create a marker for each hotel found, and
            // assign a letter of the alphabetic to each marker icon.

            $.ajax({
                type: 'POST',
                url: '/results_data',
                data: {
                    "d": JSON.stringify(results),
                    "day": day,
                    "hour": d.getHours()
                },
                dataType: "json",
                success: function (textStatus, status, result) {
                    console.log(status);

                    processMarker(results, result.responseText, lat, lng);
                    $('#overlay1').fadeOut();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(textStatus);
                    console.log(errorThrown);
                },
                complete: function () {
                    console.log("ajax complete.");
                }
            });
        }
        if (results.length == 0) {
            alert("No restaurants found! Try increasing your distance")
        }
    });
}

function processMarker(results, place_details, lat, lng) {
    document.getElementById("circle").style.backgroundColor= "#00FF00";
    console.log("Number of Results", results.length);
    var all_details = JSON.parse(place_details);
    console.log(results);
    all_ratio_curr_expected = [];
    for (var i = 0; i < results.length; i++) {
        var place_id = results[i]['place_id'];
        if (results[i].opening_hours != null && results[i].opening_hours != false && all_details[place_id]['current_popularity'] != 0 && all_details[place_id]['expected_popularity'] != 0) {
          console.log("current popularity:", results[i].name, all_details[place_id]['current_popularity'])
            all_ratio_curr_expected.push(all_details[place_id]['current_popularity'] / all_details[place_id]['expected_popularity'])
        }
    };
    for (var i = 0; i < results.length; i++) {
        var place_id = results[i]['place_id'];
        if (results[i].opening_hours != null && results[i].opening_hours != false && all_details[place_id]['current_popularity'] != 0 && all_details[place_id]['expected_popularity'] != 0) {
          console.log("current popularity:", results[i].name, all_details[place_id]['current_popularity'])
            all_ratio_curr_expected.push(all_details[place_id]['current_popularity'] / all_details[place_id]['expected_popularity'])
        }
    };
    $.ajax({
      url:"https://maps.googleapis.com/maps/api/geocode/json?address=" +"10975+Johns+Hopkins+Road,+Laurel+MD"+"&key=AIzaSyBjqoKTMlzPkY9EE9luDcpTXrftaxjifik",
      success: function(result){
        //console.log(result);
      }});
    var ratio_curr_expected = 0;
    for (var i = 0; i < all_ratio_curr_expected.length; i++) {
        ratio_curr_expected += all_ratio_curr_expected[i];
    }

    if (all_ratio_curr_expected.length > 3) {
        ratio_curr_expected = ratio_curr_expected / all_ratio_curr_expected.length;
    } else {
        var temp_val = ratio_curr_expected / all_ratio_curr_expected.length;
        if (temp_val > 1.5) {
            ratio_curr_expected = 1.5
        } else {
            ratio_curr_expected = temp_val
        }
    }
    color = '#00FF00';

    for (var i = 0; i < results.length; i++) {
        var place_id = results[i]['place_id'];
        var place_info = all_details[place_id];
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
        var markerIcon = MARKER_PATH + markerLetter + '.png';

        var current_density = 0;
        var circle_color = "#FF0000";
        var factor = 0.7;

        console.log(results[i].name, place_info['expected_popularity'], place_info['current_popularity'])

        // if (results[i].opening_hours != null) {
        //   console.log(results[i].name, results[i].opening_hours.open_now)
        // }
        if (results[i].opening_hours != null && results[i].opening_hours.open_now==false){
          current_density = 0;
        }
        else if (place_info['expected_popularity'] == 0) {
            current_density =0;
        } else if (place_info['expected_popularity'] > 0 && place_info['current_popularity'] == 0 && all_ratio_curr_expected.length == 0) {
            current_density = place_info['expected_popularity'];
            circle_color = "#FF6666";
        } else if (place_info['expected_popularity'] > 0 && place_info['current_popularity'] == 0) {
            current_density = place_info['expected_popularity'] * ratio_curr_expected;
            circle_color = "#FF6666";
        } else if (place_info['current_popularity'] > 0) {
            circle_color = "#FF0000";
            current_density = place_info['current_popularity'];
        }
        // console.log("current density: ", results[i].name, current_density);
        if (current_density > 100) {
            current_density = 100;
        };
        if (current_density < 0) {
            current_density = 0;
        };

        visual_density = current_density * factor;
        // if (current_density > 100){
        //   current_density=100;
        // };
        var markerIcon = MARKER_PATH + markerLetter + '.png';


        // Use marker animation to drop the icons incrementally on the map.
        markers[i] = new google.maps.Marker({
            position: results[i].geometry.location,
            //animation: google.maps.Animation.DROP,
            icon: markerIcon
        });
        // Add the circle for this city to the map.
        circles[i] = new google.maps.Circle({
            strokeColor: circle_color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: circle_color,
            fillOpacity: 0.35,
            map,
            center: results[i].geometry.location,
            radius: visual_density,
        });
        console.log("current_density_early: " +current_density);
        // If the user clicks a hotel marker, show the details of that hotel
        // in an info window.
        markers[i].placeResult = results[i];
        markers[i].placeDetails = place_info;
        markers[i].estimatedPop = current_density;
        google.maps.event.addListener(markers[i], 'click', showInfoWindow);
        setTimeout(dropMarker(i), i * 10);
        addResult(markers[i], i);
        temp = radarStuff(markers[i], lat, lng, i)
        console.log("temp");
        // addy = results[i]['vicinity']+"," +results[i]['plus_code']['compound_code'].split(",")[1] +"," +results[i]['plus_code']['compound_code'].split(",")[2];
        // addy = addy.replace(/\s/g, '+');
        // $.ajax({
        //   url:"https://maps.googleapis.com/maps/api/geocode/json?address=" +addy+"&key=AIzaSyBjqoKTMlzPkY9EE9luDcpTXrftaxjifik",
        //   success: function(result){
        //     lat2 = result["results"][0]['geometry']['location']['lat']
        //     lng2 = result["results"][0]['geometry']['location']['lng']
        //     Radar.getDistance({
        //       origin: {
        //         latitude: lat,
        //         longitude: lng
        //       },
        //       destination: {
        //         latitude: lat2,
        //         longitude: lng2
        //       },
        //       modes: [
        //         'foot',
        //         'car'
        //       ],
        //       units: 'imperial'
        //     }, function(err, result) {
        //       if (!err) {
        //         // do something with result.routes
        //        var dist = result["routes"]["foot"]["distance"]["value"];
        //        console.log("dist:" + dist);
        //        console.log("current density:" + current_density);
        //         if ((dist) < 1500){
        //           console.log("we here");
        //           console.log(place_info['current_popularity']);
        //           if(markers[i].estimatedPop  > 50){
        //             color = "#FF0000";
        //           }
        //           if (color!= "#FF0000"){
        //             if(markers[i].estimatedPop  > 25){
        //               color = "#FFBF00";
        //             }
        //           }
        //         }
        //       }
        //     });

      //}};
      //);

        //console.log(color);

    };

};

function radarStuff(marker, lat, lng, marker_idx) {
  addy = marker['placeResult']['vicinity']+"," +marker['placeResult']['plus_code']['compound_code'].split(",")[1] +"," +marker['placeResult']['plus_code']['compound_code'].split(",")[2];
  addy = addy.replace(/\s/g, '+');
  $.ajax({
    url:"https://maps.googleapis.com/maps/api/geocode/json?address=" +addy+"&key=AIzaSyBjqoKTMlzPkY9EE9luDcpTXrftaxjifik",
    success: function(result){
      console.log(result)
      lat2 = result["results"][0]['geometry']['location']['lat']
      lng2 = result["results"][0]['geometry']['location']['lng']
      Radar.getDistance({
        origin: {
          latitude: lat,
          longitude: lng
        },
        destination: {
          latitude: lat2,
          longitude: lng2
        },
        modes: [
          'foot',
          'car'
        ],
        units: 'imperial'
      }, function(err, result) {
        if (!err) {
          // do something with result.routes
         var dist = result["routes"]["foot"]["distance"]["value"];
         console.log("dist:" + dist);
         console.log("current density:" + marker['estimatedPop']);
         console.log(document.getElementById("circle"));
         console.log($("#circle").css('background-color'));

          if ((dist) < 1500){
            console.log("we here");
            if(marker['estimatedPop']  > 50){
              $("#circle").css('background-color', '#FF0000');
            }
            else if(marker['estimatedPop']  > 25){

              if ($("#circle").css('background-color') != "#FF0000" && $("#circle").css('background-color') != "rgb(255, 0, 0)" ){
                $("#circle").css('background-color', '#FFBF00');
              }
            }

          }
        }
      });

  }});

};


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setPosition,
          function error(err) {
            $('#overlay2').fadeOut();
            alert("Unable to acquire location! Please check your browser permissions or manually enter location.");
          }, {timeout:7000}
        );
    } else {
      $('#overlay2').fadeOut();
        alert("Unable to acquire location! Please check your browser permissions or manually enter location.");
    }
}
//
function setPosition(position) {
    var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    map.setCenter(latLng);
    $('#overlay2').fadeOut();

    // search();
}
//
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }
    markers = [];

    for (var i = 0; i < circles.length; i++) {
        if (circles[i]) {
            circles[i].setMap(null);
        }
    }
    circles = [];
}

function dropMarker(i) {
    return function () {
        markers[i].setMap(map);
    };
}
//
function addResult(marker, i) {
    result = marker.placeResult;
    var results = document.getElementById('results');
    var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));

    //var markerLetter = 'A';

    var markerIcon = MARKER_PATH + markerLetter + '.png';
    // var markerIcon = result.photos[0].getUrl({maxWidth: 100, maxHeight: 100})

    var ri = document.createElement('div');
    ri.setAttribute('class', "result_item_row")
    ri.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
    ri.onclick = function () {
        google.maps.event.trigger(markers[i], 'click');
    };

    var text_row = document.createElement('div');
    text_row.setAttribute('class', 'row result_text_row');

    // Adding Icon
    var icon_elem = document.createElement('div');
    icon_elem.setAttribute('class', 'col-1 ri_icon_elem');
    var icon_img = document.createElement('img');
    icon_img.setAttribute('class', 'ri_icon_img');
    icon_img.src = markerIcon;

    // Adding Name and Address
    var text_elem = document.createElement('div');
    text_elem.setAttribute('class', 'col-10');
    text_elem.setAttribute('id', 'ri_text_elem');

    var name_p = document.createElement('p');
    name_p.setAttribute('class', 'ri_name_text');
    var name = document.createTextNode(result.name);

    var addr_p = document.createElement('p');
    addr_p.setAttribute('class', 'ri_addr_text');
    var addr = document.createTextNode(result.vicinity);

    var text_elem2 = document.createElement('div');
    text_elem2.setAttribute('class', 'col-12');
    text_elem2.setAttribute('id', 'ri_text_elem');

    var santa_approves = document.createElement('p');
    santa_approves.innerHTML = 'Santa Approved';
    santa_approves.setAttribute('class', 'ri_addr_text');
    santa_approves.style.color = 'green';

    var santa_img = document.createElement('img');


    // Updating HTML Tree
    results.appendChild(ri);
    ri.appendChild(text_row);

    text_row.appendChild(icon_elem);
    icon_elem.appendChild(icon_img);

    text_row.appendChild(text_elem);
    text_row.appendChild(text_elem2);
    text_elem.appendChild(name_p);
    text_elem.appendChild(addr_p);
    name_p.appendChild(name);
    addr_p.appendChild(addr);


    // Adding Chart if applicable
    pop_info = marker.placeDetails["populartimes"];
    current_pop = marker.estimatedPop;
    expected_pop = marker.placeDetails['expected_popularity'];

    if (result.opening_hours != null && result.opening_hours.open_now == false) {
        status_row = document.createElement('div');
        status_row.setAttribute('class', 'row open_status');
        var status = document.createTextNode("Currently closed");
        ri.appendChild(status_row);
        status_row.appendChild(status);
    }

    if (pop_info != null) {
        if(current_pop > 50){
          santa_approves.innerHTML = 'High Traffic';
          santa_approves.style.color = 'red';
          santa_img.setAttribute('class', 'ri_img');
          santa_img.setAttribute('src', 'images/coal.png');
          text_elem2.appendChild(santa_img);

        }else if(current_pop >25){
          santa_approves.innerHTML = 'Be Cautious';
          santa_approves.style.color = '#FFBF00';
        }else{
          santa_img.setAttribute('class', 'ri_img');
          santa_img.setAttribute('src', 'images/sleigh.png');
          text_elem2.appendChild(santa_img);
        }
        text_elem2.appendChild(santa_approves);


        chart_row = document.createElement('div');
        chart_row.setAttribute('class', 'row d-flex justify-content-center');
        var canvas = document.createElement('canvas');
        new_id = 'myChart2_' + i
        canvas.setAttribute('id', new_id);
        canvas.setAttribute('class', "chartDetail")
        ri.appendChild(chart_row);
        chart_row.appendChild(canvas);

        if (i != 0) {
            renderChart(pop_info, current_pop, expected_pop, new_id, false);
        } else {
            renderChart(pop_info, current_pop, expected_pop, new_id, true);
        }
    } else {
        if (result.opening_hours != null && result.opening_hours.open_now == false) {
            // status_row = document.createElement('div');
            // status_row.setAttribute('class', 'row open_status');
            // var status = document.createTextNode("Currently closed");
            // ri.appendChild(status_row);
            // status_row.appendChild(status);
        } else {
            status_row = document.createElement('div');
            status_row.setAttribute('class', 'row open_status');
            var status = document.createTextNode("Information not available");
            ri.appendChild(status_row);
            status_row.appendChild(status);
        }
    }

}

function clearResults() {
    var results = document.getElementById('results');
    while (results.childNodes[0]) {
        results.removeChild(results.childNodes[0]);
    }
}
//
// // Get the place details for a hotel. Show the information in an info window,
// // anchored on the marker for the hotel that the user selected.
function showInfoWindow() {
    var marker = this;
    // console.log("Marker", marker);
    places.getDetails({
            placeId: marker.placeResult.place_id
        },
        function (place, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }
            infoWindow.open(map, marker);
            pop_info = marker.placeDetails["populartimes"];
            current_pop = marker.estimatedPop;
            // current_pop = marker.placeDetails['current_popularity'];
            expected_pop = marker.placeDetails['expected_popularity'];
            buildIWContent(place, pop_info, current_pop, expected_pop);
            // buildRWContent(place);
        });
}

// // Load the place information into the HTML elements used by the info window.
function buildIWContent(place, pop_info, current_pop, expected_pop) {
  var chart_list = document.getElementById('chart_holder');
  while (chart_list.childNodes[0]) {
      chart_list.removeChild(chart_list.childNodes[0]);
  };

    if (pop_info != null) {
        var chart_holder = document.getElementById('chart_holder');
        var canvas = document.createElement('canvas');


        new_id = 'window_chart_' + place.name
        canvas.setAttribute('id', new_id);
        canvas.setAttribute('class', "windowChart");
        canvas.setAttribute('height', 150);
        chart_holder.appendChild(canvas);

        if (place.opening_hours != null && place.opening_hours.open_now == false) {
          document.getElementById('iw-open-row').style.display = '';
          document.getElementById('iw-openstatus').innerHTML = "Currently Closed";
        }
        renderChart(pop_info, current_pop, expected_pop, new_id, true);

        // if (place.opening_hours != null && place.opening_hours.open_now == true) {
        //     renderChart(pop_info, current_pop, expected_pop, new_id, true);
        // } else {
        //     document.getElementById('iw-open-row').style.display = '';
        //     document.getElementById('iw-openstatus').innerHTML = "Currently Closed";
        //
        // }
    }


    document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' +
        'src="' + place.photos[0].getUrl({
            maxWidth: 100,
            maxHeight: 100
        }) + '"/>';
    document.getElementById('iw-url').innerHTML = '<text>' + place.name + '</text></p>';
    document.getElementById('iw-address').textContent = place.vicinity;
    // document.getElementById('iw-open-row').style.display = '';
    // document.getElementById('iw-openstatus').innerHTML = (expected_pop != 0 ? "Open Now!" : "Currently Closed");


    if (place.formatted_phone_number) {
        document.getElementById('iw-phone-row').style.display = '';
        document.getElementById('iw-phone').textContent =
            place.formatted_phone_number;
    } else {
        document.getElementById('iw-phone-row').style.display = 'NA';
    }

    // Assign a five-star rating to the hotel, using a black star ('&#10029;')
    // to indicate the rating the hotel has earned, and a white star ('&#10025;')
    // for the rating points not achieved.
    if (place.rating) {
        var ratingHtml = '';
        for (var i = 0; i < 5; i++) {
            if (place.rating < (i + 0.5)) {
                ratingHtml += '&#10025;';
            } else {
                ratingHtml += '&#10029;';
            }
            document.getElementById('iw-rating-row').style.display = '';
            document.getElementById('iw-rating').innerHTML = ratingHtml;
            // document.getElementById('iw-open-row').style.display = '';
            // document.getElementById('iw-openstatus').innerHTML = (place.opening_hours.open_now ? "Open Now!" : "Closed For The Day");
        }
    } else {
        document.getElementById('iw-rating-row').style.display = 'none';
    }

    // The regexp isolates the first part of the URL (domain plus subdomain)
    // to give a short URL for displaying in the info window.
    if (place.website) {
        var fullUrl = place.website;
        var website = hostnameRegexp.exec(place.website);
        if (website === null) {
            website = 'http://' + place.website + '/';
            fullUrl = website;
        }
        document.getElementById('iw-website-row').style.display = '';
        document.getElementById('iw-website').textContent = website;
    } else {
        document.getElementById('iw-website-row').style.display = 'none';
    }
    // google.maps.event.addListener(document.getElementById('place_button'), 'click', buildRWContent(place));
}

// Load the place information into the HTML elements used by the info window.
// function buildRWContent(place) {
//   var photo = place.photos[0].getUrl({ 'maxWidth': 350, 'maxHeight': 350 })
//   document.getElementById('res_image').src = photo;
//   document.getElementById('res_name').textContent = place.name;
//   document.getElementById('res_address').textContent = "Address: " + place.vicinity;
//   document.getElementById('res_rating').textContent = "Overall Rating: " + place.rating + "/5";
//   document.getElementById('res_phone_number').textContent = place.formatted_phone_number;
//   document.getElementById('res_mon').textContent = place.opening_hours.weekday_text[0];
//   document.getElementById('res_tues').textContent = place.opening_hours.weekday_text[1];
//   document.getElementById('res_wed').textContent = place.opening_hours.weekday_text[2];
//   document.getElementById('res_thurs').textContent = place.opening_hours.weekday_text[3];
//   document.getElementById('res_fri').textContent = place.opening_hours.weekday_text[4];
//   document.getElementById('res_sat').textContent = place.opening_hours.weekday_text[5];
//   document.getElementById('res_sun').textContent = place.opening_hours.weekday_text[6];
//   reset(String(place.place_id), 'http://foodwhiz.com/' + String(place.place_id) , 'foodwhiz', 'en');
// }

function getRecommendations(user) {
    var search = {
        location: {
            lat: 43.6532,
            lng: -79.3832
        },
        radius: 5000,
        keyword: String(user.categories),
        types: ['restaurant', 'meal_delivery', 'meal_takeaway']
    };
    places.nearbySearch(search, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearResults();
            clearMarkers();
            // Create a marker for each hotel found, and
            // assign a letter of the alphabetic to each marker icon.
            var pl;
            pl = results[0];
            var photo = pl.photos[0].getUrl({
                'maxWidth': 350,
                'maxHeight': 350
            });
            document.getElementById('rec1').src = photo;
            document.getElementById('rec1t') = pl.name;
        }
    });
}

function renderChart(pop_info, current_pop, expected_pop, element_id, legend_toggle) {
    var day = d.getDay() - 1;
    if (day == -1) {
        day = 6;
    }


    var data_list = [];
    var data_labels = [];
    var hover_labels = [];
    var wkday = ["Mon.", "Tues.", "Wed.", "Thurs.", "Fri.", "Sat.", "Sun."];
    for (var i = 0; i < pop_info.length; i++) {
        if (i == 0) {
            data_list = pop_info[i]['data']
            data_labels = [wkday[i] + " @ 12am", wkday[i] + " @ 1am", wkday[i] + " @ 2am", wkday[i] + " @ 3am", wkday[i] + " @ 4am",
            wkday[i] + " @ 5am", wkday[i] + " @ 6am", wkday[i] + " @ 7am", wkday[i] + " @ 8am", wkday[i] + " @ 9am",
            wkday[i] + " @ 10am", wkday[i] + " @ 11am", wkday[i] + " @ 12pm", wkday[i] + " @ 1pm", wkday[i] + " @ 2pm",
            wkday[i] + " @ 3pm", wkday[i] + " @ 4pm", wkday[i] + " @ 5pm", wkday[i] + " @ 6pm", wkday[i] + " @ 7pm",
            wkday[i] + " @ 8pm", wkday[i] + " @ 9pm", wkday[i] + " @ 10pm", wkday[i] + " @ 11pm"];
            // data_labels = ["", "", "", "", "", "", "", "", "", "", "", "", wkday[i], "", "", "", "", "", "", "", "", "", "", ""];
        } else {
            data_list = data_list.concat(pop_info[i]['data']);
            // data_labels = data_labels.concat(["", "", "", "", "", "", "", "", "", "", "", "", wkday[i], "", "", "", "", "", "", "", "", "", "", ""]);
            data_labels = data_labels.concat([wkday[i] + " @ 12am", wkday[i] + " @ 1am", wkday[i] + " @ 2am", wkday[i] + " @ 3am", wkday[i] + " @ 4am",
            wkday[i] + " @ 5am", wkday[i] + " @ 6am", wkday[i] + " @ 7am", wkday[i] + " @ 8am", wkday[i] + " @ 9am",
            wkday[i] + " @ 10am", wkday[i] + " @ 11am", wkday[i] + " @ 12pm", wkday[i] + " @ 1pm", wkday[i] + " @ 2pm",
            wkday[i] + " @ 3pm", wkday[i] + " @ 4pm", wkday[i] + " @ 5pm", wkday[i] + " @ 6pm", wkday[i] + " @ 7pm",
            wkday[i] + " @ 8pm", wkday[i] + " @ 9pm", wkday[i] + " @ 10pm", wkday[i] + " @ 11pm"]);
        }
    }

    const verticalLinePlugin = {
        getLinePosition: function (chart, pointIndex) {
            const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
            const data = meta.data;
            return data[pointIndex]._model.x;
        },
        renderVerticalLine: function (chartInstance, pointIndex) {
            const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
            const scale = chartInstance.scales['y-axis-0'];
            const context = chartInstance.chart.ctx;

            // render vertical line
            context.beginPath();
            context.strokeStyle = '#ff0000';
            context.moveTo(lineLeftOffset, scale.top);
            context.lineTo(lineLeftOffset, scale.bottom);
            context.stroke();

            // write label
            context.fillStyle = "#ff0000";
            context.textAlign = 'center';
            context.fillText('', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);
        },

        afterDatasetsDraw: function (chart, easing) {
            if (chart.config.lineAtIndex) {
                chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
            }
        }
    };

    Chart.plugins.register(verticalLinePlugin);
    current_index = day * 24 + d.getHours()

    scatter_points = []
    radius = []
    for (var k = 0; k < data_list.length; k++) {

        if (k == current_index) {
            radius.push(5)
            scatter_points.push(parseInt(current_pop));
        } else {
            radius.push(0)
            scatter_points.push(null);
        }
    }
    var ctx = document.getElementById(element_id).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data_labels,
            datasets: [
                {
                    label: "Expected Density",
                    data: data_list,
                    type: 'line'
            },
                {

                    data: scatter_points,
                    label: 'Live Prediction',
                    // steppedLine: true,
                    pointBackgroundColor: '#cd2026',
                    backgroundColor: '#cd2026',
                    pointRadius: radius,
                    pointBorderWidth: 1,
                    pointHitRadius: 5,
                    type: 'scatter',
                    fill: true,
            }]
        },
        options: {
            legend: {
                display: legend_toggle
            },
            responsive: false,
            tooltips: {
                mode: 'label',
                intersect: false
            },
            scales: {
                xAxes: [{
                    ticks: {
                        userCallback: function (item, index) {
                            if ((index + 12) % 24 == 0) {
                                item_to_return = Math.floor(index / 24);
                                // return item;
                                return wkday[item_to_return];

                            };
                        },
                        autoSkip: false
                    }
              }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
              }]
            }
        },
        lineAtIndex: [current_index],
    });

    //myChart.data.datasets[1].pointBackgroundColor = "#cc00cc";
    //myChart.data.datasets[1].pointRadius[100] = 100;
    //myChart.update();

}
// function send_data (data){
//   $.post("test", {name: "John", location: "us"});
// }

send_data = function (data, callback) {
    doAjax('POST', '/test/', data, true, function (err, user) {
        if (err) return callback(err, user);
        callback(null, user);
    });
}






$(document).ready(function(){

  initLetItSnow();
});

// Init Christmas! \o/
var initLetItSnow = function(){

	(function() {
	    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
	    function(callback) {
	        window.setTimeout(callback, 1000 / 60);
	    };
	    window.requestAnimationFrame = requestAnimationFrame;
	})();

	var flakes = [],
	    canvas = document.getElementById("xmas"),
	    ctx = canvas.getContext("2d"),
	    mX = -100,
	    mY = -100;

	    if( $(window).width() < 999 ){
	    	var flakeCount = 125;
	    } else {
	    	var flakeCount = 450;
	    }

	    canvas.width = window.innerWidth;
	    //canvas.height = window.innerHeight;
      canvas.height = 480;
	function snow() {
	    ctx.clearRect(0, 0, canvas.width, canvas.height);

	    for (var i = 0; i < flakeCount; i++) {
	        var flake = flakes[i],
	            x = mX,
	            y = mY,
	            minDist = 250,
	            x2 = flake.x,
	            y2 = flake.y;

	        var dist = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y)),
	            dx = x2 - x,
	            dy = y2 - y;

	        if (dist < minDist) {
	            var force = minDist / (dist * dist),
	                xcomp = (x - x2) / dist,
	                ycomp = (y - y2) / dist,
	                // deltaV = force / 2;
	                deltaV = force;

	            flake.velX -= deltaV * xcomp;
	            flake.velY -= deltaV * ycomp;

	        } else {
	            flake.velX *= .98;
	            if (flake.velY <= flake.speed) {
	                flake.velY = flake.speed
	            }
	            flake.velX += Math.cos(flake.step += .05) * flake.stepSize;
	        }

	        ctx.fillStyle = "rgba(255,255,255," + flake.opacity + ")";
	        flake.y += flake.velY;
	        flake.x += flake.velX;

	        if (flake.y >= canvas.height || flake.y <= 0) {
	            reset(flake);
	        }

	        if (flake.x >= canvas.width || flake.x <= 0) {
	            reset(flake);
	        }

	        ctx.beginPath();
	        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
	        ctx.fill();
	    }
	    requestAnimationFrame(snow);
	};

	function reset(flake) {
	    flake.x = Math.floor(Math.random() * canvas.width);
	    flake.y = 0;
	    flake.size = (Math.random() * 3) + 2;
	    flake.speed = (Math.random() * 1) + 0.5;
	    flake.velY = flake.speed;
	    flake.velX = 0;
	    flake.opacity = (Math.random() * 0.5) + 0.3;
	}

	function init() {
	    for (var i = 0; i < flakeCount; i++) {
	        var x = Math.floor(Math.random() * canvas.width),
	            y = Math.floor(Math.random() * canvas.height),
	            size = (Math.random() * 3) + 4,
	            speed = (Math.random() * 1) + 0.5,
	            opacity = (Math.random() * 0.5) + 0.3;

	        flakes.push({
	            speed: speed,
	            velY: speed,
	            velX: 0,
	            x: x,
	            y: y,
	            size: size,
	            stepSize: (Math.random()) / 160,
	            step: 0,
	            opacity: opacity
	        });
	    }

	    snow();
	};

	canvas.addEventListener("mousemove", function(e) {
	    mX = e.clientX,
	    mY = e.clientY
	});

	window.addEventListener("resize",function(){
	    canvas.width = window.innerWidth;
	    canvas.height = 480;
	})

	init();
};



/*
Radar.getDistance({
  origin: {
    latitude: lat,
    longitude: lng
  },
  destination: {
    latitude: result['results'][0]['geometry']['location']['lat'],
    longitude:  result['results'][0]['geometry']['location']['lng'],
  },
  modes: [
    'foot',
  ],
  units: 'imperial'
}, function(err, result) {
  if (!err) {
    console.log(result);
    if (result['routes']['foot']['distance']['value']<100){
      if(current_density) > 50){
        color = "#FF0000"
      }
      if (color!= "#FF0000"){
        if(current_density > 25){
          color = "#FFFF00"
        }
      }
    }
  }
});*/

Radar.initialize('prj_test_pk_eb6e52c971dfcc9daa351a1a70a243b7fd496a54');
Radar.ipGeocode(function(err, result) {
  if (err) {
    console.error(err);

    return;
  }

  if (result && result.address) {
    console.log(result);

    console.log("Your country is " +
      result.address.latitude + " " + result.address.longitude);


  }  
});
