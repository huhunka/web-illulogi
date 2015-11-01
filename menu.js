window.addEventListener("load", function(){

    var importWorker_ = new Worker("import-img-thread.js");
    importWorker_.addEventListener("message", onMessage, false);

    document.getElementById("menu-new").addEventListener("click", function(){
        var subpane = document.getElementById("menu-subpane");

        var w = IllulogiUI.getWidth();
        var h = IllulogiUI.getHeight();

        var w = w ? w.toString() : "";
        var h = h ? h.toString() : "";

        subpane.innerHTML = [
            '新規作成: <label>よこ<input type="number" id="menu-new-width" value="', w, '"></label> × ',
            '<label>たて<input type="number" id="menu-new-height" value="', h, '"></label> ',
            '<button type="button" id="menu-new-ok">OK</button> | ',
            '<button type="button" id="menu-new-cancel">キャンセル</button>'
        ].join('');

        document.getElementById("menu-new-ok").addEventListener("click", function(){
            var w = parseInt(document.getElementById("menu-new-width" ).value);
            var h = parseInt(document.getElementById("menu-new-height").value);

            if(0 < w && w <= IllulogiUI.MAX_WIDTH
            && 0 < h && h <= IllulogiUI.MAX_HEIGHT
            ){
                document.getElementById("menu-subpane").innerHTML = "";
                IllulogiUI.init(w, h);
            }
        });

        document.getElementById("menu-new-cancel").addEventListener("click", function(){
            document.getElementById("menu-subpane").innerHTML = "";
        });

        document.getElementById("menu-new-width").focus();
    }, false);

    document.getElementById("menu-load").addEventListener("click", function(){
        var subpane = document.getElementById("menu-subpane");

        subpane.innerHTML = [
            '読み込み: <label>ファイル<input type="file" id="menu-load-file"></label> | ',
            '<button type="button" id="menu-load-cancel">キャンセル</button>'
        ].join('');

        document.getElementById("menu-load-file").addEventListener("change", function(){
            var filelist = document.getElementById("menu-load-file").files;
            if(filelist.length < 1) return;

            var file = filelist[0];
            var ext = file.name.replace(/.+(?=\.)/, "").toLowerCase();

            var reader = new FileReader();

            if(ext == '.json'){
                reader.onload = function(){
                    var obj = JSON.parse(reader.result);
                    if(validateJSON(obj)){
                        document.getElementById("menu-subpane").innerHTML = "";
                        IllulogiUI.initWithKeys(obj.horzKeys, obj.vertKeys);
                    }
                };
                reader.readAsText(file);
            }
            else{
                reader.onload = function(){
                    importImageURL(reader.result);
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById("menu-load-cancel").addEventListener("click", function(){
            document.getElementById("menu-subpane").innerHTML = "";
        });

        document.getElementById("menu-load-file").focus();
    }, false);

    document.getElementById("menu-save").addEventListener("click", function(){
        var obj = {};
        obj.horzKeys = IllulogiUI.getHorzKeys();
        obj.vertKeys = IllulogiUI.getVertKeys();

        var blob = new Blob([ JSON.stringify(obj) ], { "type": "application/json" });
        if(window.navigator.msSaveBlob){
            window.navigator.msSaveBlob(blob, "illulogi.json");
            return;
        }

        var url = URL.createObjectURL(blob);
        var subpane = document.getElementById("menu-subpane");

        subpane.innerHTML = [
            '<a download="illulogi.json" id="menu-save-url">右クリックして保存してください</a> | ',
            '<button type="button" id="menu-save-cancel">キャンセル</button>'
        ].join('');

        document.getElementById("menu-save-url").href = url;

        document.getElementById("menu-save-cancel").addEventListener("click", function(){
            document.getElementById("menu-subpane").innerHTML = "";
        });

        document.getElementById("menu-save-url").focus();
    }, false);

    document.getElementById("menu-compute").addEventListener("click", function(){
        IllulogiUI.startComputation();
    }, false);

    IllulogiUI.init(25, 25);


    function validateJSON(json)
    {
        if(!json.horzKeys || typeof(json.horzKeys.forEach) != "function"
        || !json.vertKeys || typeof(json.vertKeys.forEach) != "function"
        ){
            Msg.print("ファイルフォーマットが不正です");
            return false;
        }

        if(json.horzKeys.length <= 0
        || json.vertKeys.length <= 0
        ){
            Msg.print("問題の面積がゼロです");
            return false;
        }

        if(json.horzKeys.length > IllulogiUI.MAX_HEIGHT
        || json.vertKeys.length > IllulogiUI.MAX_WIDTH
        ){
            Msg.print("問題が大きすぎます");
            return false;
        }

        var maxKey = (IllulogiUI.MAX_WIDTH > IllulogiUI.MAX_HEIGHT) ?
            IllulogiUI.MAX_WIDTH : IllulogiUI.MAX_HEIGHT;

        function isValidKeys(keys){
            if(!keys || typeof(keys.forEach) != "function"){
                Msg.print("ファイルフォーマットが不正です");
                return false;
            }

            var len = keys.length;
            for(var i = 0; i < len; ++i){
                var k = keys[i] | 0;
                if(k <= 0){
                    Msg.print("数でないものもしくは0以下の数がキーに含まれています");
                    return false;
                }
                keys[i] = (k <= maxKey) ? k : maxKey;
            }

            return true;
        }

        return json.horzKeys.every(isValidKeys) && json.vertKeys.every(isValidKeys);
    }

    function importImageURL(url)
    {
        var dom_img = document.createElement("img");

        dom_img.addEventListener("load", function(){
            var width  = dom_img.naturalWidth;
            var height = dom_img.naturalHeight;

            if(!width || !height){
                Msg.print("画像が取得できませんでした");
                return;
            }
            if(width > IllulogiUI.MAX_WIDTH || height > IllulogiUI.MAX_HEIGHT){
                Msg.print("画像が大きすぎます");
                return;
            }

            var dom_canvas = document.createElement("canvas");
            dom_canvas.width  = width;
            dom_canvas.height = height;

            var context = dom_canvas.getContext("2d");
            context.drawImage(dom_img, 0, 0);
            var rgba = context.getImageData(0, 0, width, height).data;

            importWorker_.postMessage({
                "msg"   : "START",
                "width" : width,
                "height": height,
                "rgba"  : rgba,
            }, [ rgba.buffer ]);
        }, false);

        dom_img.src = url;
    }

    function onMessage(ev){
        var data = ev.data;
        if(data.msg == "OK"){
            IllulogiUI.initWithKeys(data.horzKeys, data.vertKeys);
        }
    }
}, false);
