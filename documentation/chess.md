documentation for `chess.js`
===

table of contents
---

- introduction
- utilities
  - `values`
  - `types`
  - `colors`
  - `pieceNames`
  - `other(color)`
- pieces
  - `Type(type)`
  - `Color(color)`
  - `Piece({color, type})`
  - `Pawn(color)`, `Knight(color)`, `Bishop(color)`, `Rook(color)`, `Queen(color)`, `King(color)`
  - `WhitePiece(type)`, `BlackPiece(type)`
  - `piece.color`
  - `piece.type`
  - `piece.name`
  - `getPieceName(piece)`
  - `pieceList`
  - `pieces`
- positions
  - `Position(x, y)`, `Position(name)`, `Position({x, y})`
  - `position.file`, `position.rank`
  - `position.x`, `position.y`
  - `position.name`
- boards
  - `standardBoard`
  - `emptyBoard`
  - `EmptyBoard(width, height)`
  - `Board960(n)`
  - `sameBoard(boardA, boardB)`
  - `board.width`
  - `board.height`
  - `board.turn`
  - `board.at(x, y)`, `board.at(position)`
  - `board.atName(x, y)`, `board.atName(position)`
  - `board.contains(x, y)`, `board.contains(position)`
  - `board.Position(x, y)`, `board.Position(position)`
  - `board.get(x, y)`, `board.get(position)`
  - `board.set(x, y, meta)`, `board.put(x, y, piece, meta)`, `board.set(position, meta)`, `board.put(position, piece, meta)`
  - `board.flip(color)`
  - `board.delete(x, y)`, `board.delete(position)`
  - `board.check`
  - `board.checkmate`
  - `board.stalemate`, `board.draw`
  - `board.getScore(color)`
  - `board.score`
  - `board.getKingPosition(color)`
  - `board.toASCII(color)`
- moves
  - `board.Move(move)`
  - `move.play()`
  - `move.name`
  - `move.from`, `move.to`
  - `move.piece`
  - `move.promotion`
  - `move.captured`
  - `move.rook`
  - `move.before`
  - `board.play(...moves)`
  - `board.moves`

introduction
---

This module contains utilities for interacting and manipulating chess games, as well as finding valid moves for specific positions. The data structures (boards, pieces, etc.) are all immutable, and operations on them create new objects.

`values`
---

The `values` object relates piece types to their point value.

~~~ JavaScript
export let values = {pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9}
~~~

`types`
---

An array containing the names of types of pieces, all in lowercase.

~~~ JavaScript
export let types = ["pawn", "knight", "bishop", "rook", "queen", "king"]
~~~

`colors`
---

An array containing the names of piece colors, all in lowercase.

~~~ JavaScript
export let colors = ["white", "black"]
~~~

`pieceNames`
---

An array containing the names of all pieces, e.g. `white pawn`, `black pawn`, etc.

`other(color)`
---

Given a piece color, this function returns the other piece color. For other given values, the function will return `undefined`.

`Type(type)`
---

Returns the name of the type of piece that the argument `type` represents. `type` is coerced to a string, and if it matches the name of a type of piece, that string is returned, otherwise `undefined` is returned.

`Color(color)`
---

Returns the name of a piece color that the argument `color` represents. `color` is coerced to a string, and if it is either `"white"` or `"black"`, the string is returned, otherwise `undefined` is returned.

`Piece({color, type})`
---

If `color` and `type` are valid (see `Type(type)` and `Color(color)` above), this will return an object representing the piece of that color and type, otherwsise returns `undefined`. This will always return the same object (referentially equal) if its given `color` and `type` arguments represent the same color and type.

`Pawn(color)`, `Knight(color)`, `Bishop(color)`, `Rook(color)`, `Queen(color)`, `King(color)`
---

These are convenience functions for getting the object that represent the piece of the specific type of the given color. They will return `undefined` if the given `color` is invalid.

E.g. `Pawn("white") === Piece({type: "pawn", color: "white"})`

`WhitePiece(type)`, `BlackPiece(type)`
---

These are convenience functions for getting the object that represent the piece of the give type of the specific color. They will return `undefined` if the given `type` is invalid.

E.g. `WhitePiece("pawn") === Piece({type: "pawn", color: "white"})`

`piece.color`
---

This will be the color of the `piece` object. (Either `"white"` or `"black"`.)

`piece.type`
---

This will be the type of the `piece` object. (E.g. `"pawn"`, `"king"`, etc.)

`piece.name`
---

This property will be the piece’s name, e.g. `"white pawn"`, `"black pawn"`, etc. `piece.name === piece.color + " " + piece.type`

`getPieceName(piece)`
---

Deprecated alias for `piece.name`. If the given argument does not represent a piece, this will return `undefined`.

`pieceList`
---

This is an array containing all the pieces that can be returned by `Piece`.

`pieces`
---

This is an object associating piece names with piece objects. It can be indexed by either `piece.name`, or its camel case variant. E.g. `pieces["white pawn"] === pieces.whitePawn`.

`Position(x, y)`, `Position(name)`, `Position({x, y})`
---

This function creates a position in the board from its given arguments. If two values are given, they are assumed to be coordinates. If only one value is given, it should be either a string representing the position’s name, or an object containing `x` and `y` attributes representing the coordinates of the position.

Note: This function will not necessarily return the same object (referentially equal) to represent the same given position.

`position.x`, `position.y`
---

These represent the coordinates of the position as integers. E.g. for a1, `position.x === 0 && position.y === 0`.

`position.x` represents the file, and `position.y` represents the row.

`position.file`, `position.rank`
---

These represent the coordinates of the position as strings. `position.file` will be be composed of lowercase letters, whereas `position.rank` will be composed of digits.

`position.name`
---

This property represent the name of the position. `position.name === position.file + position.rank`

`standardBoard`
---

A board with the inital position of a standard game of chess. Since boards are immutable, this can be used as the starting point to perform operations to create different positions.

`emptyBoard`
---

A board with no pieces in it. This can be used to more easily set up games with custom initial positions.

`EmptyBoard(width, height)`
---

Creates an empty board with a nonstandard size. If `height` is omited, it’ll be the same as `width`. If `width` is omited, it’ll be `8` by default.

`Board960(n)`
---

This function creates a new chess 960 board. If `n` is provided, it must be a natural number lower than 960. It can be elided, however, and in that case, a value will be chosen using `Math.random(...)`.

`sameBoard(boardA, boardB)`
---

Determines if the two boards represent the same chess position.

`board.width`
---

This will be the width of the board in squares (the number of files the board has).

`board.height`
---

This will be the height of the board in squares (the number of ranks the board has).

`board.turn`
---

Which side (color) is to play. This will be either `"white"` or `"black"`.

`board.at(x, y)`, `board.at(position)`
---

This will return the piece at the given coordinates in the board. If the square does not contain a piece, this will return `null`. If the position does not represent a square in the board (because it is out of bounds), this will return `undefined`.

`board.at(0, 0) === board.at("a1")` and `board.at(7, 7) === board.at("h8")`

Likewise, e.g. `board.at({x: 2, y: 3}) === board.at("c4")`

`board.atName(x, y)`, `board.atName(position)`
---

Deprecated alias to `board.at(...)`.

`board.contains(x, y)`, `board.contains(position)`
---

Determines if the given position is part of this board (i.e. it is in bounds), returning `true` or `false` as appropriate.

`board.Position(x, y)`, `board.Position(position)`
---

Similar to `Position(...)`, but this will return `undefined` if the board does not contain the given position (i.e. it is out of bounds).

`board.get(x, y)`, `board.get(position)`
---

This will return the metadata for a piece in that position in the board. The metadata is a string, but only pawns, kings and rooks can have metadata, and what it means will depend on which it is. For other pieces, this will return `null`. If the position does not represent a square in the board (because it is out of bounds), this will return `undefined`.

For pawns, the metadata can be either `"initial"`, `"passing"` or `null`. `null` means the pawn can only move one square forwards, `"initial"` means the pawn might be able to move two squares forward, and `"passing"` means that pawn is subject to be captured via *en passant*.

For kings and rooks, the metadata can be either `"initial"`, or `null`, and together they represent the castling rights of the king.

`board.set(x, y, meta)`, `board.put(x, y, piece, meta)`, `board.set(position, meta)`, `board.put(position, piece, meta)`
---

These functions will return a new (immutable) board with the squares at the given coodinates having their pieces or metadata changed. For `board.put(...)`, the metadata given is optional. If `piece` is `null`, it’ll be removed from the board.

These functions are not yet completely ready to be used generally, and might behave strangely or inconsistently in some circumstances. The recommended way to interact with the board at the moment is by using `board.play(...)`, `board.Move(...)`, and `board.moves`.

If the change could not be performed, these functions will return `undefined`.

`board.flip(color)`
---

Returns a new board with the given side as the current to play. If `color` is not given, it’ll be the opposite color of the current side to play. Like the two functions above (`board.set(...)` and `board.put(...)`), this might behave strangely if not used carefully.

If `color` does not represent a valid color, this function will return `undefined`.

`board.delete(x, y)`
---

Shortcut for `board.set(x, y, null)`. If the position does not represent a square in the board (because it is out of bounds), this will return `undefined`.

`board.check`
---

This will be `true` if the king of the side to play is in check, and `false` otherwise. Checkmates are considered checks for the purposes of this property.

`board.checkmate`
---

This will be true if the game has ended due to a checkmate.

`board.stalemate`, `board.draw`
---

These will be true if the game has ended due to a stalemate.

`board.getScore(color)`
---

Returns the material points of the given side or `undefined` if `color` is not a valid color. If `color` is not given, it’ll be the color of the current side to play.

`board.score`
---

This is the material points of white.

`board.getKingPosition(color)`
---

This will return the position of the king of the given color. If no color is specified, it’ll be the color of the current side to play.

If `color` does not represent a color, this will return `undefined`.

`board.toASCII(color)`
---

Returns an ASCII art representation of the board, with the given color at the bottom. This will return `undefined` if `color` does not represent a valid color.

`board.Move(move)`
---

If `move` is a string, this will return the move object represented by the given string. If the string does not represent a legal move name for the current board, this will return `undefined`. Move names must be given in UCI format.

Otherwise, if `move` is a move object, this will return an object representing the same move if the given move is a move on a board that is the same as this (as determined by `sameBoard(...)`).

`move.play()`
---

Returns a new board object representing the position after this move having been played. This should never return `undefined`.

`move.name`
---

This will be the name of the move in UCI format.

`move.from`, `move.to`
---

These will be the starting and ending positions of the moving piece respectively.

`move.piece`
---

This will be the piece being moved.

`move.promotion`
---

In case this move causes a promotion, this will be the piece the pawn will promote to.

If this move does not cause a promotiong, this field will be absent.

`move.captured`
---

If this move is a captured, this will contain information about the capture. `move.captured.piece` is the piece that was captured, and `move.captured.position` is the position of the captured piece.

For most moves, `move.captured.position` will be the same as `move.to`, but it will be different for *en passant*.

If this move is not a capture, this field will be absent.

`move.rook`
---

For castling moves, this will contain information about the rook being moved.

`move.rook.from` contains the rook’s previous position, `move.rook.to` contains the rook’s target position, and `move.rook.piece` contains the rook as a piece.

If this move is not a castling move, this field will be absent.

`move.before`
---

This is the board before the move was played.

`board.play(...moves)`
---

This will play the given moves in order. Moves can be either strings of the move name in UCI format or move objects belonging to this board.

If any of the moves is not valid, this will return `undefined`, otherwise it’ll return a new board representing the position after having played the moves.

`board.moves`
---

This will be an array containing all the valid move objects for the position this board is in.
