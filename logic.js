// tristate
var TUNKNOWN = 0;
var TFALSE   = 1;
var TTRUE    = 2;

var TUNDEFINED = 3;

function computeMatrix(horzKeys, vertKeys, progress)
{
    var width  = vertKeys.length;
    var height = horzKeys.length;

    var pixels = newMatrix(width, height);

    while(true){
        var clone = cloneMatrix(pixels);
        if(computeMatrixOnePass(horzKeys, vertKeys, pixels)){
            if(areEqualMatrices(pixels, clone)){
                if(isDeterminateMatrix(pixels)){
                    return {
                        "status": TTRUE,
                        "pixels": pixels,
                    }
                }
                else{
                    return {
                        "status": TUNKNOWN,
                        "pixels": pixels,
                    }
                }
            }
            else{
                progress(pixels);
            }
        }
        else{
            return {
                "status": TFALSE,
                "pixels": pixels,
            }
        }
    }
}

function computeMatrixOnePass(horzKeys, vertKeys, pixels)
{
    var width  = vertKeys.length;
    var height = horzKeys.length;

    var column = new Array(height); // 縦の処理用のメモリ

    function computeHorz(i){
        return computeLine(horzKeys[i], pixels[i]);
    }

    function computeVert(i){
        for(var y = 0; y < height; ++y){
            column[y] = pixels[y][i];
        }

        var bOK = computeLine(vertKeys[i], column);

        for(var y = 0; y < height; ++y){
            pixels[y][i] = column[y];
        }

        return bOK;
    }

    var min_wh = (width < height) ? width : height;
    for(var i = 0; i < min_wh; ++i){
        if(!computeHorz(i)) return false;
        if(!computeVert(i)) return false;
    }

    for(var i = min_wh; i < height; ++i){
        if(!computeHorz(i)) return false;
    }
    for(var i = min_wh; i < width; ++i){
        if(!computeVert(i)) return false;
    }

    return true;
}

function computeLine(keys, row)
{
    var nKeys   = keys.length;
    var rowSize = row.length;

    // 各キーがどこまで右にいけるかを計算
    var locLimits = new Array(nKeys);
    if(nKeys > 0){
        locLimits[nKeys-1] = rowSize + 1 - keys[nKeys-1];
        for(var i = nKeys - 2; i >= 0; --i){
            locLimits[i] = locLimits[i+1] - keys[i] - 1;
        }
        if(locLimits[0] <= 0){
            // キーを全部並べるスペースがない
            return false;
        }
    }

    // "ixKey を loc に置くことができるか"
    // という情報のキャッシュ
    var cacheLocatable = new Array(nKeys * rowSize);
    var len = cacheLocatable.length;
    for(var i = 0; i < len; ++i){
        cacheLocatable[i] = TUNKNOWN;
    };

    // nextRow を TUNDEFINED で初期化
    var nextRow = new Array(rowSize);
    for(var i = 0; i < rowSize; ++i){
        nextRow[i] = TUNDEFINED;
    }

    // 並べてみる
    var bPossible = computeLine_helper
    (   nextRow
    ,   cacheLocatable
    ,   row
    ,   keys
    ,   locLimits
    ,   0
    ,   0
    );

    // マップをコピー
    for(var i = 0; i < rowSize; ++i){
        row[i] = nextRow[i];
    }

    return bPossible;
}

function computeLine_helper
(   nextRow
,   cacheLocatable
,   row
,   keys
,   locLimits
,   ixKey
,   locBegin
){
    var nKeys   = keys.length;
    var rowSize = row.length;

    // 再帰停止条件: 全部のキーを並べた
    if(ixKey >= nKeys){

        // 最後のマスまでに、黒確定マスがあってはいけない
        var locRight = rowSize;
        for(var i = locBegin; i < locRight; ++i){
            if(row[i] == TTRUE) return false;
        }

        // nextRow を白く塗る
        for(var i = locBegin; i < rowSize; ++i){
            if     (nextRow[i] == TUNDEFINED) nextRow[i] = TFALSE;
            else if(nextRow[i] == TTRUE     ) nextRow[i] = TUNKNOWN;
        }

        // OK
        return true;
    }

    // キャッシュ(cacheLocatable[ixKey][loc]) の列番号
    var offCache = ixKey * rowSize;
    // 前回の演算結果は?
    var cache = cacheLocatable[offCache + locBegin];
    if(cache == TTRUE ) return true ;
    if(cache == TFALSE) return false;

    // 再帰的に keys を並べていく

    // row の上に key と loc を配置可能か調べる関数
    function IsLocatable(key, loc)
    {
        // 左端から右端までに、白確定マスがあると、ダメ
        while(key-- > 0){
            if(row[loc++] == TFALSE) return false;
        }
        // 右端の次のマスが黒だと、ダメ
        if(loc < rowSize && row[loc]  == TTRUE){
            return false;
        }

        // 大丈夫。loc を始点にして、key を置くことは可能
        return true;
    }

    // 現在のキーと、それが右に行ける限界の位置
    var locEnd = locLimits[ixKey];
    var key    = keys     [ixKey];

    // locBegin 以降に、keyを配置可能か?
    var bPossible = false;

    // キーを locBegin から だんだん右にずらしつつ
    for(var loc = locBegin; loc < locEnd; ++loc){
        if(IsLocatable(key, loc) // もし、loc の位置に key を置けるのであれば
        && computeLine_helper   // 再帰して残りのキーを並べてみる
           (   nextRow
           ,   cacheLocatable
           ,   row
           ,   keys
           ,   locLimits
           ,   ixKey+1
           ,   loc+key+1
           )
        ){
            // 残りのキーも配置可能だったので、nextRow を塗る

            // [locBegin, loc) は白
            var i;
            for(i = locBegin; i < loc; ++i){
                if     (nextRow[i] == TUNDEFINED) nextRow[i] = TFALSE;
                else if(nextRow[i] == TTRUE     ) nextRow[i] = TUNKNOWN;
            }
            // [loc, loc+key) は黒
            var locRight = loc + key;
            for(; i < locRight; ++i){
                if     (nextRow[i] == TUNDEFINED) nextRow[i] = TTRUE;
                else if(nextRow[i] == TFALSE    ) nextRow[i] = TUNKNOWN;
            }
            // loc+key の位置は白
            if(i < rowSize){
                if     (nextRow[i] == TUNDEFINED) nextRow[i] = TFALSE;
                else if(nextRow[i] == TTRUE     ) nextRow[i] = TUNKNOWN;
            }

            // 結果をキャッシュ
            cacheLocatable[offCache + loc] = TTRUE;
            bPossible = true;
        }
        else{
            // 結果をキャッシュ
            cacheLocatable[offCache + loc] = TFALSE;
        }

        // もし、loc が黒確定マスだったら、
        // これ以上右に寄せることはできない
        if(row[loc] == TTRUE){
            locEnd = loc + 1;
            break;
        }
    }

    if(bPossible){
        // cacheLocatable[offCache + loc] は、
        // ここまででは "loc に置けるか" という意味だが
        // これを "loc - locEnd に置けるか" に変更する
        var triReduced = TFALSE;
        for(var loc = locEnd - 1; loc >= locBegin; --loc){
            if(triReduced == TFALSE){
                triReduced = cacheLocatable[offCache + loc];
            }
            cacheLocatable[offCache + loc] = triReduced;
        }
    }

    return bPossible;
}

function newMatrix(width, height)
{
    var row = new Array(width);
    for(var i = 0; i < width; ++i){
        row[i] = TUNKNOWN;
    }

    var pixels = new Array(height);
    for(var i = 0; i < height; ++i){
        pixels[i] = row.map(function(e){ return e; });
    }

    return pixels;
}

function cloneMatrix(pixels)
{
    return pixels.map(function(row){
        return row.map(function(e){ return e; });
    });
}

function areEqualMatrices(m1, m2)
{
    var h = m1.length;
    for(var y = 0; y < h; ++y){
        var r1 = m1[y];
        var r2 = m2[y];
        var w = r1.length;
        for(var x = 0; x < w; ++x){
            if(r1[x] != r2[x]) return false;
        }
    }

    return true;
}

function isDeterminateMatrix(pixels)
{
    return pixels.every(function(row){
        return row.every(function(e){ return e != TUNKNOWN; });
    });
}
