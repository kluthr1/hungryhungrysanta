var model = (function(){
	"use strict";

    var doAjax = function (method, url, body, json, callback){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(e){
            switch(this.readyState){
                 case (XMLHttpRequest.DONE): 
                    if (this.status === 200) {
                        if(json) return callback(null, JSON.parse(this.responseText));
                        return callback(null, this.responseText);
                    }else{
                        return callback(new Error(this.responseText), null);
                    }
            }
        };
        xhttp.open(method, url, true);
        if (json && body){
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.send(JSON.stringify(body)); 
        }else{
            xhttp.send(body);  
        }        
    };

	var model = {};

    model.signOut = function(callback){
        doAjax('DELETE', '/api/signout/', null, false, callback);
    };

    model.signIn = function(data, callback){
        doAjax('POST', '/api/signin/', data, true, function(err, user){
            if (err) return callback(err, user);
            callback(null, user);
        });
    }

    model.createUser = function(data, callback){
        doAjax('PUT', '/api/users/', data, true, callback);
    };

    model.getCategories = function(data, callback){
        doAjax("GET", "/api/users/", null, true, callback);
    }

    return model;
}())