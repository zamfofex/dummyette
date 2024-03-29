`dummyette.js` examples
===

This module allows convertion to and from conventional chess notations.

It can convert moves to their SAN representation as strings. After import importing the `toSAN(...)` function, a move object (from the `chess.js` module) can be passed in to it to convert it to a SAN string

~~~ JavaScript
import {standardBoard} from ".../dummyette/chess.js"
import {toSAN} from ".../dummyette/notation.js"

console.log(toSAN(standardBoard.Move("e2e4"))) // e4
console.log(toSAN(standardBoard.Move("g1h3"))) // Nh3
~~~

It can also parse FEN strings into board objects.

~~~ JavaScript
import {fromFEN} from ".../dummyette/notation.js"

console.log(fromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").toASCII())
~~~
