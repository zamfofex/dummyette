`dummyette.js` examples
===

This module can be used to make a (bad) analysis to find out what the best moves for a position in a chess game is.

The first thing we need to do is import the `analyse(board)` function.

~~~ JavaScript
import {analyse} from ".../dummyette/dummyette.js"
~~~

We can pass it a board object, and it’ll return an array of what it judges to be the best position for the current side to play in that board. The array will be ordered from “best” to “worst”, such that the first element in the array will be the move judged best, and the last element will be the move it judges worst.

~~~ JavaScript
let moves = analyse(boad)
let bestMove = moves[0]
let worstMove = moves[moves.length - 1]

console.log("Best move: " + bestMove.name)
console.log("Worst move: " + worstMove.name)

// Play the best found move.
board = bestMove.play()
~~~
