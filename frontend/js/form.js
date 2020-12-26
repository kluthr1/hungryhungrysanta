(function(model){
    "use strict";

    var showError = function(message){
        var e = document.getElementById("error");
        e.innerHTML = `<span class="alert">${(message)}</span>`;
        e.style.display = "block";
    };

    document.getElementById("signin_enter").onclick = function (e){
        e.preventDefault();
        var data = {};
        data.username = document.getElementById("username").value;
        data.password = document.getElementById("password").value;
        if (data.username.length>0 && data.password.length>0){
            model.signIn(data,function(err,user){
                if (err) return showError(err);
                window.location = '/signin.html';
                getRecommendations(user);
                //getFavourites();
            });
        }
    };

    document.getElementById("signup_enter").onclick = function (e){
        e.preventDefault();
        var data = {};
        data.username = document.getElementById("new_username").value;
        data.password = document.getElementById("new_password").value;
        data.address = getUserPlace();
        var favs = document.getElementsByClassName("fav_category");
        data.categories = [];
        var i;
        for (i=0; i < favs.length; i++){
            if(favs[i].checked){
                data.categories.push(favs[i].value)
            }
        }
        if (data.username.length>0 && data.password.length>0 && data.categories.length != 0){
            model.createUser(data,function(err,user){
                if (err) return showError(err);
                window.location = '/';
            });
        }
    };

}(model))