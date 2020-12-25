var path = require('path');
var express = require('express');
var app = express();
var crypto = require('crypto');
var markerData = require("./markerdata");


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));


var http = require("http");
var server = http.createServer(app);

app.on('listening',function(){
    console.log('ok, server is running');
});
app.use(bodyParser.json());
var port_number = express().listen(process.env.PORT || 3000);
app.listen(port_number);
/* Not Used
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
*/

var Datastore = require('nedb');
var places = new Datastore({
  filename: 'db/places.db',
  autoload: true
});
