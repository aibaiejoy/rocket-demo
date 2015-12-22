;(function($){

rocket.subview.index_content = rocket.subview.extend({

	el : '#index_page_content'

    ,events:{
        "click .index-btn-score":"gohome",
        "click .show-rule":"showRule"
    }

	, init : function(options){
		var me = this;
        me.dialog = $(".show-rule-dialog").hide();
        me.dialog.find(".show-rule-dialog-inner-close").on("click", function(){
            me.dialog.hide();
        })
		me.show();
		
	}
    , gohome: function(){
        var me = this;
        var audioBackgroundMusic = document.getElementById("audioBackgroundMusic");
        audioBackgroundMusic.play();
        me.navigate("#home");
    }
    , showRule: function(){
        this.dialog.show();
    }

})
})(Zepto);
