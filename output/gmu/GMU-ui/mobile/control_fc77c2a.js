!function(t){t.ui.define("control",function(){var o=t.os,n=parseFloat(o.version),i=!n,s=o.ios,e=(o.android,/htc_sensation_z710e/i.test(navigator.userAgent)),c={};return c.fix=function(o,c){var a=t(o),o=a.get(0),u=navigator.userAgent,r=/Linux/i.test(u)||t.os.ios&&!/safari/i.test(u)&&!/qq/i.test(u),d=t.extend({zIndex:999},c||{}),p=c.bottom?-1*c.bottom:c.top||0;return!(i||s&&n>=5)||e||r?(d.position="absolute",a.css(d),void(o.isFixed||(o.isFixed=!0,t(document).on("scrollStop",function(){a.css("top",window.pageYOffset+(c.bottom?window.innerHeight-a.height():0)+p+"px")
})))):(a.css("position","fixed").css(d),!o.isFixed&&t.browser.qq&&t(document).on("scrollStop",function(){a.css("top",Math.max(-45,-window.pageYOffset)+"px")}),void(o.isFixed=!0))},c.setFloat=function(o){var n=t(o),i=n.clone().css({opacity:0,display:"none"}).attr("id",""),s=!1,e={},a=n.css("position")||"static",u=function(){c.fix(n,{x:0,y:0}),i.css("display","block"),s=!0},r=function(){n.css("position",a),i.css("display","none"),s=!1},d=function(t){var o=i.get(0).getBoundingClientRect().top||n.get(0).getBoundingClientRect().top,t=t||0+o;
0>t&&!s?u():t>0&&s&&r()};n.after(i),t(document).on("touchstart",function(t){e.y=t.touches[0].pageY}).on("touchmove",function(t){var o=t.touches[0].pageY-e.y;e.y=t.touches[0].pageY,d(o)}),t(window).on("scroll",function(){d()})},c})}(Zepto);