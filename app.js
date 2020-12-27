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
var users = new Datastore({
    filename: 'db/users.db',
    autoload: true
});

var User = function (user) {
    var salt = crypto.randomBytes(16).toString('base64');
    var hash = crypto.createHmac('sha512', salt);
    hash.update(user.password);
    this.username = user.username;
    this.picture = null;
    this.salt = salt;
    this.saltedHash = hash.digest('base64');
    this.address = user.address;
    this.categories = user.categories;
    this.favourites = null;
};

// Authentication
var checkPassword = function (user, password) {
    var hash = crypto.createHmac('sha512', user.salt);
    hash.update(password);
    var value = hash.digest('base64');
    return (user.saltedHash === value);
};

var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        sameSite: true
    }
}));

app.use(function (req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    return next();
});

// serving the frontend

app.get('/frontend/index.html', function (req, res, next) {
    if (!req.session.user) return res.redirect('/');
    return next();
});

app.post('/results_data', function (req, res, next) {
    var place_ids = [];

    markerData = req.body;
    temp_data = JSON.parse(markerData["d"]);
    for (i = 0; i < temp_data.length; i++) {
        curr_json = temp_data[i];
        place_ids.push(curr_json["place_id"]);
    };
    var spawn = require("child_process").spawn;
    var child = spawn('python', ["poptimes_wrapper.py", place_ids, markerData['day'], markerData['hour']]);
    var place_details = "";

    child.stdout.on('data', function (data) {
        data = data.toString();
        place_details += data;
    });

    child.on('close', (code) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(place_details);
    });
});

// app.get('/results_data', function (req, res, next) {
//    //console.log("here", markerData.getMarkerData());
//    res.send('GET request to the homepage')
//  });

app.get('/signout/', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) return res.status(500).end(err);
        return res.redirect('/');
    });
});

app.use(express.static('frontend'));

// signout, signin

app.delete('/api/signout/', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) return res.status(500).end(err);
        return res.redirect('/');
    });
});

app.post('/api/signin/', function (req, res, next) {
    if (!req.body.username || !req.body.password) return res.status(400).send("Bad Request");
    users.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user || !checkPassword(user, req.body.password)) return res.status(401).end("Unauthorized");
        req.session.user = user;
        res.cookie('username', user.username);
        return res.json(user);
    });
});

// Read

app.get('/api/users/:categories', function (req, res, next) {
    if (!req.session.user) return res.status(403).end("Forbidden");
    var json = JSON.stringify({
        cat: req.session.user.categories
    });
    response.end(json);

});


// Create

app.put('/api/users/', function (req, res, next) {
    var data = new User(req.body);
    users.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("Username " + req.body.username + " already exists");
        users.insert(data, function (err, user) {
            if (err) return res.status(500).end(err);
            return res.json(user);
        });
    });
}); 
