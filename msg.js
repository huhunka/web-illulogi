var Msg = (function(){
var Msg = {};

var hEraserTimer_ = null;

Msg.print = print;
function print(msg)
{
    if(hEraserTimer_ !== null){
        window.clearTimeout(hEraserTimer_);
        hEraserTimer_ = null;
    }

    var dom_msg = document.getElementById('msg');
    dom_msg.innerHTML = msg;
    dom_msg.classList.add('shown');

    hEraserTimer_ = setTimeout(function(e){
        document.getElementById('msg').classList.remove('shown');
        hEraserTimer_ = null;
    }, 10000);
}

return Msg;
})();
