!function(e){rocket.subview.home_content=rocket.subview.extend({el:"#home_page_content",init:function(n){var o=this;o.isFirstLoad=!0,o.model=new rocket.model.home(null,e.extend({},n)),o.show(),o.showLoading(),o.render()},registerEvents:function(){{var n=this;n.ec}e("#music-btn").on("click",n.onMusicBtnClick,n)},unregisterEvents:function(){{var e=this;e.ec}},selectCompany:function(){},onpagebeforechange:function(e){{var n=this,o=(e.from,e.to);e.params}if(o==n.ec){if(n.isFirstLoad){if(n.loadingLock)return;
n.loadingLock=!0,n.model.fetch({type:"POST",success:function(){n.isFirstLoad=!1,n.loadingLock=!1},error:function(){n.loadingLock=!1}})}n.$el.show()}},onMusicBtnClick:function(n){var o=e(n.currentTarget),t=o.hasClass("play"),i=window.audioBackgroundMusic||document.getElementById("audioBackgroundMusic");t?(e("#music-btn").removeClass("play"),i.pause()):(e("#music-btn").addClass("play"),i.play()),e("#music-text").text(t?"开启":"关闭")},render:function(){var n=this,o=n.options||{};n.append(new rocket.subview.home_content_clist(e.extend({},o),n)),n.hideLoading()
}})}(Zepto);