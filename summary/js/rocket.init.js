(function($) {

$.extend(rocket, {
    init: function() {
        // loading object
        rocket.$globalLoading = $('#wrapper .global-loading');
        rocket.$pageLoading = $('#wrapper .page-loading');

        var router = new rocket.router.summary();

        // globalview init
        // new rocket.globalview.gotop({}, router);
        webappandroid.levelnav
            = new rocket.globalview.levelnav({}, router);        

        Backbone.history.start();

        function scroll(e){
            $(document.body).height(600);

            // http://remysharp.com/2010/08/05/doing-it-right-skipping-the-iphone-url-bar/
            setTimeout(function(){
                //window.scrollTo(0, 0);
                setTimeout(function(){
                    $(document.body).height($(window).height());
                }, 0);
                rocket.isLoaded = true;
                
            }, 1000); 

        }

        $(function(e){
            //scroll();
        });
        
        new rocket.globalview.ui_shareWx({}, router);
    }

});

})(Zepto);    

