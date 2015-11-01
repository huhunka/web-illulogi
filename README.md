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
