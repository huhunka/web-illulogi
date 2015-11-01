self.importScripts("logic.js");

self.addEventListener("message", function(ev){
    var data = ev.data;
    if(data.msg == "START"){
        var result = computeMatrix(data.horzKeys, data.vertKeys, function(pixels){
            //self.postMessage({
            //    "msg"   : "CONTINUE",
            //    "pixels": pixels,
            //});
        });

        var msg;

        if(result.status == TFALSE){
            msg = "ERROR";
        }
        else if(result.status == TTRUE){
            msg = "END";
        }
        else if(result.status == TUNKNOWN){
            msg = "INDETERMINATE";
        }
        self.postMessage({
            "msg"   : msg,
            "pixels": result.pixels,
        });
    }
}, false);
