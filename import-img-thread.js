self.importScripts("logic.js");

function importImage(width, height, rgba, progress)
{
    var size = width * height;
    var pixels = new Float32Array(size);

    var conv = Float32Array(256);
    for(var c = 0; c < 256; ++c){
        if(c < 11){
            conv[c] = 0.00030352698354884 * c;
        }
        else{
            conv[c] = Math.pow(0.003717126661091 * (c + 14.025), 2.4);
        }
    }

    for(var i = 0; i < size; ++i){
        var off = 4*i;
        pixels[i] = 0.2126*conv[rgba[off]] + 0.7152*conv[rgba[off+1]] + 0.0722*conv[rgba[off+2]];
    }

    var luminos = uniqSort(new Float32Array(pixels));
    var lenLuminos = luminos.length;
    var thresh;
    if(lenLuminos <= 1){
        thresh = 0.25;
    }
    else{
        // Binary-search the threshold for quantizing the luminosity to 0 or 1.
        // We assume that the blacker the image the easier it is to solve it, or
        // the following two conditions are (quasi-)invariant in the while loop:
        //      thresh <= luminos[left] : unsolvable
        //      luminos[right] <= thresh: solvable
        // The first condition obviously doesn't hold in the beginning (left == 0)
        // but it is not a problem... perhaps.
        var left   = 0;
        var right  = lenLuminos - 1;
        while(right - left >= 2){
            var middle = (0.5*(left + right)) | 0;
            var keys = generateKeysFromImage(width, height, pixels, luminos[middle]);
            var middleIsSolvable = computeMatrix(keys.horzKeys, keys.vertKeys, function(){}).status;
            if(middleIsSolvable === TTRUE){
                right = middle;
            }
            else{
                left = middle;
            }
        }

        thresh = luminos[right];
    }

    return generateKeysFromImage(width, height, pixels, thresh);
}

function generateKeysFromImage(width, height, pixels, thresh)
{
    var horzKeys = new Array(height);
    for(var y = 0; y < height; ++y){
        var keys = [];
        for(var x = 0; x < width; /**/){
            if(pixels[y*width + (x++)] < thresh){
                var k = 1;
                while(x < width && pixels[y*width + (x++)] < thresh){
                    ++k;
                }
                keys.push(k);
            }
        }
        horzKeys[y] = keys;
    }

    var vertKeys = new Array(width);
    for(var x = 0; x < width; ++x){
        var keys = [];
        for(var y = 0; y < height; /**/){
            if(pixels[(y++)*width + x] < thresh){
                var k = 1;
                while(y < height && pixels[(y++)*width + x] < thresh){
                    ++k;
                }
                keys.push(k);
            }
        }
        vertKeys[x] = keys;
    }

    return {
        "horzKeys": horzKeys,
        "vertKeys": vertKeys,
    };
}

function uniqSort(array)
{
    var len = array.length;
    if(len <= 1) return array;

    Array.prototype.sort.call(array, function(a, b){ return a - b; });

    var prev = array[0];
    var dest = 1;
    for(var i = 1; i < len; ++i){
        if(prev !== array[i]){
            array[dest++] = prev = array[i];
        }
    }

    return array.subarray(0, dest);
}

self.addEventListener("message", function(ev){
    var data = ev.data;
    if(data.msg == "START"){
        var keys = importImage(data.width, data.height, data.rgba, function(){});

        self.postMessage({
            "msg": "OK",
            "horzKeys": keys.horzKeys,
            "vertKeys": keys.vertKeys,
        });
    }
}, false);
