(function($){

var webappandroid = window.webappandroid = window.webappandroid || {},
    _login = webappandroid.login 
        = webappandroid.login || {};


function _getBDUSS(){
    return webappandroid.helper.cookieGet('BDUSS');
}

function _isLoggedIn(){
    return !!_getBDUSS();
}

// interface
$.extend(_login, {

    getBDUSS: _getBDUSS
    , isLoggedIn: _isLoggedIn

});


})(Zepto);

