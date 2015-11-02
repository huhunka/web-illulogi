# web-illulogi
An illust-logic solver on the web.
https://huhunka.github.io/web-illulogi/

This is an illust-logic solver that works on the web
using client-side scripts only.  Originally, I wrote
the program in C++ for Win32 and published in a
web-site that is now closed due to the end of the
service that had provided the server for the web-site.

Now I publish it as a web application with a few modification:
* The solver does not perform reductionem ad absurdum.
  Very few (but not none of) quizzes need it, and very few quizzes
  get solvable with it.
* The image-to-quiz converter tries to produce solvable outputs.
  This means an unsolvable monochrome image will be
  converted to a simple black image.

## usage
* You can input numbers in the top- and left- corner of the matrix.
  For Microsoft Edge users: Do not click on the bottommost or leftmost
  cells to set focus on them. The focus will be lost in an undesirable way.

* By pressing on the '読み込み' button, you can load either a JSON
  or an image.  A JSON that can be read can be produced by pressing
  '保存' button.  An image, if selected, will be converted to a
  solvable quiz.  Don't be angry if the output is too black.
  It is the least black quiz that an idiot algorithm finds solvable.

---------------------------------------

# web-illulogi
イラストロジックを解くウェブ上プログラム
https://huhunka.github.io/web-illulogi/

クライアントサイドのスクリプトでイラストロジックを解きます。
このプログラムはもともと私がC++でWin32用に書いて公開したものなのですが、
置いていたサーバのサービスが終了したので公開停止になりました。

それをここにウェブアプリとして公開します。ただし：
* 背理法を使いません。背理法が必要な問題は少ないです
  (なくはないです)し、背理法で頑張って初めて解けるようになる問題も
  少ないです。
* 画像を読み込んで問題を作成するときは、解ける問題を作ります。
  白黒画像を読み込ませても、解けないならば、真っ黒な画像に変換されます。

## 使い方
* マトリクスの上と左にくっついているエリアに数字を入力できます。
  (Microsoft Edgeの方へ)数字エリアの一番下あるいは一番左のセルを
  クリックしてフォーカスを合わせないでください。そのフォーカスは
  嫌な外れ方をします。

* '読み込み' ボタンを押すと JSON か画像をロードできます。
  JSON は、'保存' ボタンで出力されるものです。
  画像を選択した場合は、解ける問題に変換されます。
  結果が真っ黒になっても怒らないでください。アホなアルゴリズムは、
  それが解ける問題のうち一番黒くないものだと思って提示してます。
