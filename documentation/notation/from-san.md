documentation for `notation/from-san.js`
===

table of contents
---

- introduction
- parsing
  - `toMoves(board, name)`
  - `toMove(board, name)`

introduction
---

This module contains functions to convert to values from `chess.js` from SAN and UCI notation.

`toMoves(board, name)`
---

This will return an array with all moves from `board` that are candidates for the given move name. This move parsing is loose, which means it will accept SAN and UCI notation as well as things between them. This will return an empty array if the name could not be parsed or if no moves in the board are representable as the given name.

`toMove(board, name)`
---

Similar to `toMoves(board, name)`, except this will return only one move. This will return `undefined` if the move name was ambiguous for the given board, if there were no moves that are representible as the given name, or if the name could not be parsed.
