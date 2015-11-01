var IllulogiUI = (function(){
var IllulogiUI = {};

var MAX_WIDTH  = 9999;
var MAX_HEIGHT = 9999;

IllulogiUI.MAX_WIDTH = MAX_WIDTH;
IllulogiUI.MAX_HEIGHT = MAX_HEIGHT;

var width_   ;
var height_  ;
var horzKeys_;
var vertKeys_;
var pixels_  ;

var PX_UNKNOWN = 0;
var PX_WHITE   = 1;
var PX_BLACK   = 2;

var g_worker = new Worker("logic-thread.js");
g_worker.addEventListener("message", onMessage, false);

IllulogiUI.init = init;
function init(width, height)
{
    if(width <= 0 || height <= 0){
        return;
    }

    width_  = width ;
    height_ = height;

    horzKeys_ = new Array(height);
    for(var i = 0; i < height; ++i){
        horzKeys_[i] = [];
    }

    vertKeys_ = new Array(width);
    for(var i = 0; i < width; ++i){
        vertKeys_[i] = [];
    }

    var row = new Array(width);
    for(var i = 0; i < width; ++i){
        row[i] = PX_UNKNOWN;
    }

    pixels_ = new Array(height);
    for(var i = 0; i < height; ++i){
        pixels_[i] = row.map(function(e){ return e; });
    }

    rebuild();
}

IllulogiUI.initWithKeys = initWithKeys;
function initWithKeys(horzKeys, vertKeys)
{
    var width  = vertKeys.length;
    var height = horzKeys.length;

    if(width <= 0 || height <= 0){
        return;
    }

    width_  = width ;
    height_ = height;

    horzKeys_ = new Array(height);
    for(var i = 0; i < height; ++i){
        horzKeys_[i] = horzKeys[i].map(function(e){ return parseInt(e); });
    }

    vertKeys_ = new Array(width);
    for(var i = 0; i < width; ++i){
        vertKeys_[i] = vertKeys[i].map(function(e){ return parseInt(e); });
    }

    var row = new Array(width);
    for(var i = 0; i < width; ++i){
        row[i] = PX_UNKNOWN;
    }

    pixels_ = new Array(height);
    for(var i = 0; i < height; ++i){
        pixels_[i] = row.map(function(e){ return e; });
    }

    rebuild();
}

IllulogiUI.rebuild = rebuild;
function rebuild()
{
    var horzKeyW = requiredHorzKeyWidth();
    var vertKeyH = requiredVertKeyHeight();

    var html_topLeftSpace = [
        '<td class="space" rowspan="', vertKeyH,
        '" colspan="', horzKeyW, '"></td>'
    ].join('');

    var html_vertKeys = new Array(vertKeyH);
    for(var i = 0; i < vertKeyH; ++i){
        var row = new Array(width_);
        var tabindex = (i === vertKeyH - 1)? ' tabindex="0"' : '';
        for(var j = 0; j < width_; ++j){
            var coord = [' data-coord="[', (i - vertKeyH).toString(), ',', j.toString(), ']"'].join('');
            var keys = vertKeys_[j];
            var index = i - vertKeyH + keys.length;
            if(index >= 0){
                row[j] = ['<th class="key"', tabindex, coord, '>', keyToStr(keys[index]), '</th>'].join('');
            }
            else{
                row[j] = ['<th class="key"', tabindex, coord, '></th>'].join('');
            }
        }
        html_vertKeys[i] = row;
    }

    var html_horzKeys = new Array(height_);
    for(var i = 0; i < height_; ++i){
        var row = new Array(horzKeyW);
        var keys = horzKeys_[i];
        var offset = horzKeyW - keys.length;
        for(var j = 0; j < offset; ++j){
            var coord = [ ' data-coord="[', i.toString(), ',', (j - horzKeyW).toString(), ']"'].join('');
            var tabindex = (j === horzKeyW - 1)? ' tabindex="0"' : '';
            row[j] = ['<th class="key"', tabindex, coord, '></th>'].join('');
        }
        for(var j = offset; j < horzKeyW; ++j){
            var coord = [ ' data-coord="[', i.toString(), ',', (j - horzKeyW).toString(), ']"'].join('');
            var tabindex = (j === horzKeyW - 1)? ' tabindex="0"' : '';
            row[j] = ['<th class="key"', tabindex, coord, '>', keyToStr(keys[j - offset]), '</th>'].join('');
        }
        html_horzKeys[i] = row;
    }

    var html_pixels = new Array(height_);
    for(var y = 0; y < height_; ++y){
        html_pixels[y] = pixels_[y].map(function(pxl, x){
            return ['<td class="pixel ', pixelClass(pxl),
                '" data-coord="[', y.toString(), ',', x.toString(), ']">',
                pixelToStr(pxl), '</td>'].join('');
        });
    }

    // concat vertKeys
    html_vertKeys[0].unshift(html_topLeftSpace);
    html_vertKeys = html_vertKeys.map(function(row){
        return '<tr>' + row.join('') + '</tr>';
    });

    // concat horzKeys + pixels
    for(var y = 0; y < height_; ++y){
        html_horzKeys[y] = [
            '<tr>', html_horzKeys[y].join(''), html_pixels[y].join(''), '</tr>'
        ].join('');
    }

    document.getElementById("illulogi").innerHTML = [
        '<tbody>', html_vertKeys.join(''), '</tbody>',
        '<tbody>', html_horzKeys.join(''), '</tbody>'
    ].join('');

    // set behaviors
    forEach(document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key'), function(e){
        e.addEventListener("click", onClickVertKey, false);
    });
    forEach(document.querySelectorAll('table#illulogi > tbody:nth-child(2) th.key'), function(e){
        e.addEventListener("click", onClickHorzKey, false);
    });
    forEach(document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key[tabindex]'), function(e){
        e.addEventListener("focus", onFocusVertKey, false);
        e.addEventListener("blur", onBlurVertKey, false);
        e.addEventListener("dblclick", onDblClickVertKey, false);
        e.addEventListener("keydown", onKeyDownVertKey, false);
    });
    forEach(document.querySelectorAll('table#illulogi > tbody:nth-child(2) th.key[tabindex]'), function(e){
        e.addEventListener("focus", onFocusHorzKey, false);
        e.addEventListener("blur", onBlurHorzKey, false);
        e.addEventListener("dblclick", onDblClickHorzKey, false);
        e.addEventListener("keydown", onKeyDownHorzKey, false);
    });
}

function requiredHorzKeyWidth()
{
    var max = 5;
    for(var i = 0; i < height_; ++i){
        var len = horzKeys_[i].length;
        if(max < len) max = len;
    }

    return (Math.floor((max + 4) / 5) | 0) * 5;
}

function requiredVertKeyHeight()
{
    var max = 5;
    for(var i = 0; i < width_; ++i){
        var len = vertKeys_[i].length;
        if(max < len) max = len;
    }

    return (Math.floor((max + 4) / 5) | 0) * 5;
}

function pixelClass(pixel)
{
    if(pixel == PX_WHITE){
        return "white";
    }
    else if(pixel == PX_BLACK){
        return "black";
    }
    else{
        return "unknown";
    }
}

function pixelToStr(pixel)
{
    if(pixel == PX_WHITE){
        return ":";
    }
    else if(pixel == PX_BLACK){
        return "#";
    }
    else{
        return " ";
    }
}

IllulogiUI.getWidth = getWidth;
function getWidth()
{
    return width_;
}

IllulogiUI.getHeight = getHeight;
function getHeight()
{
    return height_;
}

IllulogiUI.getHorzKeys = getHorzKeys;
function getHorzKeys()
{
    return horzKeys_;
}

IllulogiUI.getVertKeys = getVertKeys;
function getVertKeys()
{
    return vertKeys_;
}

var prevRefreshTime_;

IllulogiUI.startComputation = startComputation;
function startComputation()
{
    prevRefreshTime_ = Date.now();

    g_worker.postMessage({
        "msg"     : "START",
        "horzKeys": horzKeys_,
        "vertKeys": vertKeys_,
    });
}

function onMessage(ev)
{
    var data = ev.data;

    if(Date.now() - prevRefreshTime_ >= 0.5
    || data.msg != "CONTINUE"
    ){
        updatePixels(data.pixels);
        prevRefreshTime_ = Date.now();
    }

    if(data.msg == "CONTINUE") return;

    if(data.msg == "END"){
        ; // 終了
    }
    else if(data.msg == "INDETERMINATE"){
        Msg.print("解が定まりません");
    }
    else{
        Msg.print("解が存在しません");
    }
}

IllulogiUI.updatePixels = updatePixels;
function updatePixels(pixels)
{
    pixels_ = pixels;

    // var dom_tbody = document.querySelector('table#illulogi > tbody:nth-child(2)');
    //
    // var dom_tr = dom_tbody.firstChild;
    // pixels_.forEach(function(row){
    //     var dom_td = dom_tr.querySelector('td:nth-of-type(1)');
    //     row.forEach(function(pxl){
    //         dom_td.className = 'pixel ' + pixelClass(pxl);
    //         dom_td.innerHTML = pixelToStr(pxl);
    //
    //         dom_td = dom_td.nextSibling;
    //     });
    //
    //     dom_tr = dom_tr.nextSibling;
    // });
    //
    // 上のようにするより普通に innerHTML 作り直したほうが速い
    rebuild();
}

function onClickHorzKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;
    target.parentNode.querySelector('th.key[tabindex]').focus();
}

function onClickVertKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    var coord = JSON.parse(target.getAttribute("data-coord"));
    var x = (coord[1]+1).toString();

    document.querySelector('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + x + ')[tabindex]').focus();
}

function onFocusHorzKey(ev)
{
    var target = ev.currentTarget;

    forEach(target.parentNode.querySelectorAll('th.key'), function(e){
       e.classList.add("focus");
    });
}

function onFocusVertKey(ev)
{
    var target = ev.currentTarget;

    var coord = JSON.parse(target.getAttribute("data-coord"));
    var x = (coord[1]+1).toString();

    forEach(document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + x + ')'), function(e){
        e.classList.add("focus");
    });
}

function onBlurHorzKey(ev)
{
    finishEditing();
    clearFocus();
}

function onBlurVertKey(ev)
{
    finishEditing();
    clearFocus();
}

function clearFocus()
{
    forEach(document.querySelectorAll('table#illulogi .focus'), function(e){
        e.classList.remove("focus");
        e.classList.remove("editing");
    });
}

function onDblClickHorzKey(ev)
{
    onClickHorzKey(ev);

    var target = ev.currentTarget;
    if(target.innerHTML != ''){
        target.classList.add("editing");
    }
}

function onDblClickVertKey(ev)
{
    onClickVertKey(ev);

    var target = ev.currentTarget;
    if(target.innerHTML != ''){
        target.classList.add("editing");
    }
}

function onKeyDownHorzKey(ev)
{
    var key = ev.key;
    switch(key){
    case 'ArrowUp'  : case 'Up':
        return moveFocusUp(ev);
    case 'ArrowDown' : case 'Down':
        return moveFocusDown(ev);
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
        return onKeyDownDigitHorzKey(ev, parseInt(key));
    case ' ':
        return onKeyDownSpaceHorzKey(ev);
    case 'Enter':
        return onKeyDownEnterHorzKey(ev);
    case "Backspace": case "Del": case "Delete":
        return onKeyDownBackspaceHorzKey(ev);
    }
}

function onKeyDownVertKey(ev)
{
    var key = ev.key;
    switch(key){
    case 'ArrowLeft': case 'Left':
        return moveFocusLeft(ev);
    case 'ArrowRight': case 'Right':
        return moveFocusRight(ev);
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
        return onKeyDownDigitVertKey(ev, parseInt(key));
    case ' ':
        return onKeyDownSpaceVertKey(ev);
    case 'Enter':
        return onKeyDownEnterVertKey(ev);
    case "Backspace": case "Del": case "Delete":
        return onKeyDownBackspaceVertKey(ev);
    }
}

function moveFocusLeft(ev)
{
    var coord = JSON.parse(ev.currentTarget.getAttribute("data-coord"));

    if(coord[0] < 0 && coord[1] - 1 >= 0){
        var x = coord[1].toString();
        document.querySelector('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + x + ')[tabindex]').focus();
        ev.stopPropagation();
        ev.preventDefault();
    }
}

function moveFocusUp(ev)
{
    var coord = JSON.parse(ev.currentTarget.getAttribute("data-coord"));

    if(coord[1] < 0 && coord[0] - 1 >= 0){
        var y = coord[0].toString();
        document.querySelector('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + y + ') > th.key[tabindex]').focus();
        ev.stopPropagation();
        ev.preventDefault();
    }
}

function moveFocusRight(ev)
{
    var coord = JSON.parse(ev.currentTarget.getAttribute("data-coord"));

    if(coord[0] < 0 && coord[1] + 1 < width_){
        var x = (coord[1]+2).toString();
        document.querySelector('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + x + ')[tabindex]').focus();
        ev.stopPropagation();
        ev.preventDefault();
    }
}

function moveFocusDown(ev)
{
    var coord = JSON.parse(ev.currentTarget.getAttribute("data-coord"));

    if(coord[1] < 0 && coord[0] + 1 < height_){
        var y = (coord[0]+2).toString();
        document.querySelector('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + y + ') > th.key[tabindex]').focus();
        ev.stopPropagation();
        ev.preventDefault();
    }
}

function onKeyDownDigitHorzKey(ev, digit)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.classList.contains('editing')){
        var coord = JSON.parse(target.getAttribute('data-coord'));
        var y = coord[0];
        var keys = horzKeys_[y];

        var key = keys[keys.length-1];
        if(key || digit){
            var key = key*10 + digit;
            if(key <= MAX_WIDTH){
                keys[keys.length-1] = key;
                target.innerHTML = keyToStr(key);
            }
        }
    }
    else{
        pushNewHorzKey(target, digit);
    }
}

function onKeyDownDigitVertKey(ev, digit)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.classList.contains('editing')){
        var coord = JSON.parse(target.getAttribute('data-coord'));
        var x = coord[1];
        var keys = vertKeys_[x];

        var key = keys[keys.length-1];
        if(key || digit){
            var key = key*10 + digit;
            if(key <= MAX_HEIGHT){
                keys[keys.length-1] = key;
                target.innerHTML = keyToStr(key);
            }
        }
    }
    else{
        pushNewVertKey(target, digit);
    }
}

function onKeyDownSpaceHorzKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.innerHTML != ''){
        pushNewHorzKey(target, 0);
    }
}

function onKeyDownSpaceVertKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.innerHTML != ''){
        pushNewVertKey(target, 0);
    }
}

function onKeyDownEnterHorzKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.classList.contains('editing')){
        finishEditing();
        target.classList.remove('editing');
    }
    else{
        moveFocusDown(ev);
    }
}

function onKeyDownEnterVertKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;

    if(target.classList.contains('editing')){
        finishEditing();
        target.classList.remove('editing');
    }
    else{
        moveFocusRight(ev);
    }
}

function onKeyDownBackspaceHorzKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;
    var y = JSON.parse(target.getAttribute("data-coord"))[0];
    var keys = horzKeys_[y];

    if(keys.length == 0) return;
    var key = keys[keys.length-1];

    if(key && target.classList.contains('editing')){
        key = Math.floor(key / 10) | 0;
        keys[keys.length-1] = key;
        target.innerHTML = keyToStr(key);
    }
    else{
        keys.pop();

        var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + (y+1) + ') > th.key');
        for(var i = dom_keys.length - 1; i > 0; --i){
            dom_keys[i].innerHTML = dom_keys[i-1].innerHTML;
        }
        dom_keys[0].innerHTML = '';

        dom_keys[dom_keys.length - 1].classList.remove("editing");
    }
}

function onKeyDownBackspaceVertKey(ev)
{
    ev.stopPropagation();
    ev.preventDefault();

    var target = ev.currentTarget;
    var x = JSON.parse(target.getAttribute("data-coord"))[1];
    var keys = vertKeys_[x];

    if(keys.length == 0) return;
    var key = keys[keys.length-1];

    if(key && target.classList.contains('editing')){
        key = Math.floor(key / 10) | 0;
        keys[keys.length-1] = key;
        target.innerHTML = keyToStr(key);
    }
    else{
        keys.pop();

        var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + (x+1) + ')');
        for(var i = dom_keys.length - 1; i > 0; --i){
            dom_keys[i].innerHTML = dom_keys[i-1].innerHTML;
        }
        dom_keys[0].innerHTML = '';

        dom_keys[dom_keys.length - 1].classList.remove("editing");
    }
}

function pushNewHorzKey(target, digit)
{
    var y = JSON.parse(target.getAttribute('data-coord'))[0];
    var keys = horzKeys_[y];
    keys.push(digit);

    var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + (y+1) + ') > th.key');
    if(dom_keys[0].innerHTML == ''){
        var len = dom_keys.length;
        for(var i = 1; i < len; ++i){
            dom_keys[i-1].innerHTML = dom_keys[i].innerHTML;
        }

        dom_keys[len-1].innerHTML = keyToStr(digit);
    }
    else{
        rebuild();
    }

    var target = document.querySelector('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + (y+1) + ') > th.key[tabindex]');
    target.classList.add('editing');
    target.focus();
}

function pushNewVertKey(target, digit)
{
    var x = JSON.parse(target.getAttribute('data-coord'))[1];
    var keys = vertKeys_[x];
    keys.push(digit);

    var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + (x+1) + ')');
    if(dom_keys[0].innerHTML == ''){
        var len = dom_keys.length;
        for(var i = 1; i < len; ++i){
            dom_keys[i-1].innerHTML = dom_keys[i].innerHTML;
        }

        dom_keys[len-1].innerHTML = keyToStr(digit);
    }
    else{
        rebuild();
    }

    var target = document.querySelector('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + (x+1) + ')[tabindex]');
    target.classList.add('editing');
    target.focus();
}

function finishEditing()
{
    horzKeys_.forEach(function(keys, y){
        if(keys.length > 0 && !keys[keys.length-1]){
            keys.pop();

            var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(2) > tr:nth-child(' + (y+1) + ') > th.key');
            for(var i = dom_keys.length - 1; i > 0; --i){
                dom_keys[i].innerHTML = dom_keys[i-1].innerHTML;
            }
            dom_keys[0].innerHTML = '';
        }
    });
    vertKeys_.forEach(function(keys, x){
        if(keys.length > 0 && !keys[keys.length-1]){
            keys.pop();

            var dom_keys = document.querySelectorAll('table#illulogi > tbody:nth-child(1) th.key:nth-of-type(' + (x+1) + ')');
            for(var i = dom_keys.length - 1; i > 0; --i){
                dom_keys[i].innerHTML = dom_keys[i-1].innerHTML;
            }
            dom_keys[0].innerHTML = '';
        }
    });
}

function keyToStr(key)
{
    if(key){
        var k = key.toString();
        return ['<span class="d', k.length, '">', k, '</span>'].join('');
    }
    else{
        return '';
    }
}

function forEach(pseudoArray, func)
{
    if(pseudoArray == null) return;
    var len = pseudoArray.length;
    for(var i = 0; i < len; ++i){
        func.call(pseudoArray, pseudoArray[i], i, pseudoArray);
    }
}

return IllulogiUI;
})(); // IllulogiUI
