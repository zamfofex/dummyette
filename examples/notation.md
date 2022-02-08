`dummyette.js` examples
===

This module allows move to be converted to their SAN (“Standard Algebraic Notation”) representation as strings. After import importing the `toSAN(...)` function, a move object (from the `chess.js` module) can be passed in to it to convert it to a SAN string

~~~ JavaScript
import {standardBoard} from ".../dummyette/chess.js"
import {toSAN} from ".../dummyette/notation.js"

console.log(toSAN(standardBoard.Move("e2e4"))) // e4
console.log(toSAN(standardBoard.Move("g1h3"))) // Nh3
~~~

