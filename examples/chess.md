`chess.js` examples
===

The `chess.js` module was designed from the start to be convenient to use. Although some useful functionality isn’t implemented yet, what is actually there should be fairly smooth to use and understand.

The data structures in the module are all immutable. What that means is that you can’t modify objects in a way that changes how they behave. The operations performed on them actually create *different* objects that are completely independent.

The easiest way to get started is by importing `standardBoard` from the module. It is a standard chess board in its inital position.

~~~ JavaScript
import {standardBoard} from ".../dummyette/chess.js"

let board = standardBoard
~~~

We can verify that the board is in its inital position by using the `board.toASCII()` function to get a string with ASCII art of the board. We can also query which pieces are in each square by using the `board.atName(name)` function.

~~~ JavaScript
// Show ASCII art of the board.
console.log(board.toASCII())

console.log(board.atName("e1")) // "white king"
console.log(board.atName("d8")) // "black queen"
console.log(board.atName("c2")) // "white pawn"
console.log(board.atName("f5")) // null
~~~

Note: In these examples, even though I write e.g. `"white king"` in the comments (for brevity), in reality, pieces are not strings, they are represented by objects containing the properties `piece.color` and `piece.type`. Colors and types, however, *are* represented by strings.

Now that we have a board, we can start playing moves on it. The easiest way to play moves is with the `board.play(name)` function. We can provide a UCI move name to it, and it’ll play the move if it is valid.

Note, however, that our board is immutable! If we just call the function without storing its return value, it won’t actually do anything.

~~~ JavaScript
console.log(board.atName("d2")) // "white pawn"
board.play("d2d4")
console.log(board.atName("d2")) // Still "white pawn"!
~~~

The `board.play("d2d4")` function call will return us a new board that we need to keep in order to actually be able to see our change.

~~~ JavaScript
console.log(board.atName("d2")) // "white pawn"

board = board.play("d2d4")

console.log(board.atName("d2")) // null
console.log(board.atName("d4")) // "white pawn"
~~~

Note that once you write `board.play("d2d4")` for white, it becomes black’s turn, and the next move you play has to be valid for black. You can figure out the side to play with `board.turn` which will be either `"white"` or `"black"`.

~~~ JavaScript
console.log(board.turn) // "black"
~~~

A lot of the time, we will want to operate on board square using numeric coordinates rather than their name because it can make it easier to do some kinds of computations. We can use the `board.at(x, y)` function to get a piece at the square with those coordinates. Note that the coordinates start at zero, so a1 would be `board.at(0, 0)` and d3 would be `board.at(3, 2)`.

We might also want to enumerate available legal moves. To do this, we can use `board.moves`, which will be an array containing the available moves on the position.

~~~ JavaScript
console.log(board.moves)
~~~

Each move in `board.moves` will *not* be a just a string like `"e7e5"`, but rather an object containing a function `move.play()`, as well as its name `move.name === "e7e5"`.

If we want to get one of these move objects from a move name, we can use `board.Move("e7e5")`.

~~~ JavaScript
board = board.Move("e7e5").play()
// Same as:
// board = board.play("e7e5")
~~~

Note, however, that if the move name is not valid for that position, `board.Move(...)` and `board.play(...)` will return `undefined`, so the two lines above differ in behavior in that case.

~~~ JavaScript
// “DeFn1031” is not a valid move name.

// The following will throw an error, trying to access the ‘play’ member of ‘undefined’.
board = board.Move("DeFn1031").play()

// The following will not throw an error, but will leave the ‘board’ variable as ‘undefined’.
board = board.play("DeFn1031")
~~~

We can easily come up with a program that plays a couple random moves for each player and shows the result.

~~~ JavaScript
for (let i = 0 ; i < 10 ; i++)
	board = board.moves[Math.floor(Math.random() * board.moves.length)].play()
console.log(board.toASCII())
~~~

As we saw earlier, pieces are objects containing `piece.color` and `piece.type` properties. But an interesting thing to note is that all pieces on the board of the same type and color will be referrentially equal. That is to say, we can effectively compare pieces using `==` or `===`, and it’ll work as you would expect.

If we have a `color` and `type`, we can use them to find a piece with those as properties using the `Piece` function. If you pass it something that doesn’t represent a piece, it’ll return `undefined`.

~~~ JavaScript
import {Piece} from ".../dummyette/chess.js"

let object = {color: "white", type: "king"}
let piece = Piece(object)

let king = board.atName("e1")

console.log(king) // "white king"
console.log(king === object) // false
console.log(king === piece) // true

console.log(Piece("hello")) // undefined
~~~

If you want a specific piece you want, you can use the `pieces` object to access it directly.

~~~ JavaScript
import {pieces} from ".../dummyette/chess.js"

console.log(pieces.whiteKing)
console.log(pieces.whiteQueen)
console.log(pieces.blackKing)
console.log(pieces.blackQueen)
~~~

As a convenince, there are also `Pawn`, `King`, `Queen`, etc. functions that take a color and return the appropriate piece. The functions `WhitePiece` and `BlackPiece` do the converse, taking a type and returning the appropriate piece.

~~~ JavaScript
import {Pawn, WhitePiece} from ".../dummyette/chess.js"

console.log(pieces.whitePawn === Pawn("white")) // true
console.log(pieces.whitePawn === WhitePiece("pawn")) // true
~~~
