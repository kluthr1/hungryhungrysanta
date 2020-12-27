const { once } = require('events');

async function parseMarkerData(markerData){
  var place_ids = [];
  temp_data = JSON.parse(markerData["data"]);

  for (i = 0; i< temp_data.length; i++) {
    curr_json = temp_data[i];
    place_ids.push(curr_json["place_id"]);
  };

  var spawn = require("child_process").spawn;
  var details_to_return = {};
  for (i=0; i<place_ids.length; i++) {
    var location = place_ids[i];
    console.log(location);
    var place_details = "";
    var child = spawn('python',["../../test/testing.py", location]);
    child.stdout.on('data', function(data) {
      data=data.toString();
      place_details+=data;
      details_to_return[location] = place_details
    });

    await once(child, 'close')
  };
  return (details_to_return);
};

module.exports.parseMarkerData = parseMarkerData;
