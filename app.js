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
