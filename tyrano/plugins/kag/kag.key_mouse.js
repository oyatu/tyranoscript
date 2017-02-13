/*
 * キーボードとマウス操作を支援するプラグインです.
 * キーボード:
 *     [ENTER]や[SPACE]で、次のメッセージへ.
 *     [ESC]でメッセージウィンドウを消す.
 * マウス:
 *     マウスの右クリックでメニューを表示.
 *     ※メニューが非表示の場合、メッセージウィンドウを消します.
 *
 * This is a plugin to support the operation of keyboard and mouse.
 * Keyboard:
 *     Press [Enter] or the space key to go to the next message.
 *     Press [Ecs] to hide the message window.
 * Mouse:
 *     Right-clicking displays the menu.
 *     Note: When the menu is not displayed, hide the message window.
 *
 *  Special Thanks for Keito
 *
 */
tyrano.plugin.kag.key_mouse = {
    kag : null,

    //キーコンフィグ。デフォルトは用意しておく
    keyconfig : {
        key : {},
    },

    map_key : {},
    map_mouse:{},
    map_ges:{},
    
    //状況に応じて変化する
    is_swipe: false,
    timeoutId:0,
    
    //指が動いた状態を管理するための値
    start_point:{x:0,y:0},
    end_point:{x:0,y:0},
    

    init : function() {

        var that = this;

        this.keyconfig = __tyrano_key_config;

        this.map_key = this.keyconfig["key"];
        this.map_mouse = this.keyconfig["mouse"];
        this.map_ges = this.keyconfig["gesture"];

        $(document).keyup(function(e) {

            var keycode = e.keyCode;

            //イベント登録済みなら
            if (that.map_key[keycode]) {

                if ( typeof that.map_key[keycode] == "function") {
                    //関数の場合
                    that.map_key[keycode]();
                } else {
                    if (that[that.map_key[keycode]]) {
                        that[that.map_key[keycode]]();
                    }
                }
            }

        });

        $(document).on("mousedown", function(e) {
            
            var target = null
            
            //中央クリック
            if (e.which == 2) {
                
                target = that.map_mouse["center"];
                
            }else if(e.which == 3){
                //右クリック
                target = that.map_mouse["right"];
            
            }
            
            if(typeof target=="function"){
                target();
            }else{
                if(that[target]){
                    that[target]();
                }
            }
            
        });
        
        var mousewheelevent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
        $(document).on(mousewheelevent,function(e){
            
            //メニュー表示中は進めない。
            if(!that.canShowMenu()){
                return ;
            }
            
            //メニュー表示中は無効にする
            if ($(".menu_close").size() > 0 && $(".layer_menu").css("display") != "none") {
                return ;
            }
            
            var delta = e.originalEvent.deltaY ? -(e.originalEvent.deltaY) : e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -(e.originalEvent.detail);
            
            var target = null;
            
            if (delta < 0){
                // マウスホイールを下にスクロールしたときの処理を記載
                target = that.map_mouse["wheel_down"];
                
            } else {
                // マウスホイールを上にスクロールしたときの処理を記載
                target = that.map_mouse["wheel_up"];
            }
            
            if(typeof target=="function"){
                target();
            }else{
                if(that[target]){
                    that[target]();
                }
            }
            
        });
        
        
        var layer_obj_click = $(".layer_event_click");
        
        //スマートフォンイベント
        if($.userenv() != "pc"){
            layer_obj_click.swipe(
                {
                    swipe:function(event, direction, distance, duration, fingerCount, fingerData){
                        that.is_swipe = true;
                        //console.log("wwwwwwwwwwwwwww");
                        //console.log(direction+":"+distance+":"+duration+":"+fingerCount+":"+fingerData);
                        //$(this).text("You swiped " + direction );
                        
                        if(that.map_ges["swipe_"+direction]){
                            
                            if(that.map_ges["swipe_"+direction]["finger"] == fingerCount){
                                if(that[that.map_ges["swipe_"+direction]["action"]]){
                                   that[that.map_ges["swipe_"+direction]["action"]](); 
                                }
                            }
                        }
                        
                        event.stopPropagation();  
                        event.preventDefault();
                        return false;
                    },
                    
                    fingers:"all"
                }
            );
            
            
            layer_obj_click.on("touchstart", function() {
                that.timeoutId = setTimeout(function(){
                    if(that[that.map_ges["hold"]["action"]]){
                        that.is_swipe = true;
                        that[that.map_ges["hold"]["action"]](); 
                    }
                    
                }, 2000);
            }).on('touchend', function() {
                clearTimeout(that.timeoutId);
                that.timeoutId = null;
            });
            
            
        }
        
        layer_obj_click.click(function(e){
            // POSSIBLE IMPROVE
            // make "isReturn" variable
            // and do all if statements
            // then do "if (isReturn) return;"
            if(that.is_swipe){
                that.is_swipe = false;
                return false;
            }
            
            if(that.kag.stat.is_hide_message == true){
                that.kag.layer.showMessageLayers();
                    
                return false;
            }
            
            //テキスト再生中にクリックされた場合、文字列を進めて終了にする
            if(that.kag.stat.is_adding_text == true){
                that.kag.stat.is_click_text = true;
                return false;;
            }
            
            //テキストマッハ表示時もリターン。
            if(that.kag.stat.is_click_text == true){
                return false;
            }
            
            if(that.kag.stat.is_stop == true){
                return false;
            }

            that.kag.ftag.nextOrder();
            
        });
        
        
    },

/*
     if ($('.button_menu').is(':visible')) {
                    that.kag.key_mouse.showMenu();
                } else {
                    that.kag.key_mouse.hideMessage();
                }
            
 * */

    //next
    next : function() {
        //指定された動作を発火させる
        if (this.kag.key_mouse.canClick()) {
            $(".layer_event_click").click();
        }
    },

    showmenu : function() {
        if (this.canShowMenu()) {
            if ($(".menu_close").size() > 0 && $(".layer_menu").css("display") != "none") {
                $(".menu_close").click();
            } else {
                $(".button_menu").click();
            }
        }
    },

    hidemessage : function() {
        if (this.canShowMenu()) {
            if ($(".menu_close").size() > 0 && $(".layer_menu").css("display") != "none") {
                $(".menu_close").click();
            } else {
                if (!this.kag.stat.is_strong_stop) {
                    if (this.kag.stat.is_hide_message) {
                        this.kag.layer.showMessageLayers();
                    } else {
                        this.kag.ftag.startTag("hidemessage");
                    }
                }
            }
        }
    },
    
    save:function(){
        this._role("save");
    },
    load:function(){
        this._role("load");  
    },
    menu:function(){
        this._role("menu");
    },
    title:function(){
        this._role("title");
    },
    skip:function(){
        this._role("skip");
    },
    backlog:function(){
        this._role("backlog");
    },
    fullscreen:function(){
        this._role("fullscreen");
    },
    qsave:function(){
        this._role("qsave");
    },
    qload:function(){
        this._role("qload");
    },
    auto:function(){
        this._role("auto");
    },
    
    //役割系のロジック
    _role : function(role) {

        var that = this;
        
        //roleがクリックされたら、skip停止。スキップ繰り返しでやったりやめたり
        if(that.kag.stat.is_skip==true && role=="skip"){
            that.kag.stat.is_skip = false;
            return false;
        }
        
        that.kag.stat.is_skip = false;
        
        //オートは停止
        if (role != "auto") {
            that.kag.ftag.startTag("autostop", {});
        }

        //文字が流れているときは、セーブ出来ないようにする。
        if (role == "save" || role == "menu" || role == "quicksave" || role == "sleepgame") {

            //テキストが流れているときとwait中は実行しない
            if (that.kag.stat.is_adding_text == true || that.kag.stat.is_wait == true) {
                return false;
            }

        }

        switch(role) {

            case "save":
                that.kag.menu.displaySave();
                break;

            case "load":
                that.kag.menu.displayLoad();
                break;

            case "window":
                that.kag.layer.hideMessageLayers();
                break;
            case "title":

                $.confirm($.lang("go_title"), function() {
                    location.reload();
                }, function() {
                    return false;
                });
                break;
                
            case "menu":
                that.kag.menu.showMenu();
                break;
            case "skip":
                that.kag.ftag.startTag("skipstart", {});
                break;
            case "backlog":
                that.kag.menu.displayLog();
                break;
            case "fullscreen":
                that.kag.menu.screenFull();
                break;
            case "quicksave":
                that.kag.menu.setQuickSave();
                break;
            case "quickload":
                that.kag.menu.loadQuickSave();
                break;
            case "auto":
                if (that.kag.stat.is_auto == true) {
                    that.kag.ftag.startTag("autostop", {});
                } else {
                    that.kag.ftag.startTag("autostart", {});
                }
                break;

            case "sleepgame":

                if (that.kag.tmp.sleep_game != null) {
                    return false;
                }

                //ready
                that.kag.tmp.sleep_game = {};

                that.kag.ftag.startTag("sleepgame", _pm);
                break;

        }


    },

    canClick : function() {
        if ($(".layer_event_click").css("display") != "none") {
            return true;
        }
        return false;
    },

    canShowMenu : function() {
        if ($(".layer_free").css("display") == "none") {
            return true;
        }
        return false;
    },
};

/*

 ///マウス周り
 //スライドイベント
 layer_obj_click.bind('touchstart', function(e) {
 e.preventDefault();                     // ページが動くのを止める
 var pageX = event.changedTouches[0].pageX; // X 座標の位置
 var pageY = event.changedTouches[0].pageY; // Y 座標の位置
 that.start_point.x = pageX;
 that.start_point.y = pageY;

 //console.log("start -------");
 //console.log(pageY);

 });

 //スライドイベント
 layer_obj_click.bind('touchend', function(e) {

 if(that.kag.stat.visible_menu_button==false){
 return false;
 }

 e.preventDefault();                     // ページが動くのを止める
 var pageX = event.changedTouches[0].pageX; // X 座標の位置
 var pageY = event.changedTouches[0].pageY; // Y 座標の位置

 that.end_point.x = pageX;
 that.end_point.y = pageY;

 var move_x = that.end_point.x - that.start_point.x;
 var move_y = that.end_point.y - that.start_point.y;

 ////
 if(move_x > 250){
 //右スライド
 console.log("右スライド");
 }else if(move_y > 50){
 //縦スライド
 that.kag.ftag.startTag("showmenu", {});

 }

 });

 * */

