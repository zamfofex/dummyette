documentation for `fast-chess.js`
===

deprecation notice
---

This module is deprecated. Use the `chess.js` module directly instead.

table of contents
---

- introduction
- mutable boards
  - `MutableBoard(board)`
  - `board.getScore()`
  - `board.getMoves()`
  - `board.isCheck()`
- moves
  - `move.play()`
  - `move.unplay()`
- serialization
  - `board.toJSON()`
  - `fromJSON(board)`

introduction
---

This module can be used to operate on mutable chess board objects, which is generally much faster than operating the board objects in the `chess.js` module.

`MutableBoard(board)`
---

This function will create a mutable board from the given `board` argument from the `chess.js` module. If the board passed is not 8 by 8 in width and height, it will return `undefined`.

It makes some assumptions about the board passed in, which should be true if using a board derived from `standardBoard` in the `chess.js` module.

`board.getScore()`
---

This function will return the score of white for the current position in the board.

`board.getMoves()`
---

This will return the valid moves in the given position.

`board.isCheck()`
---

Returns `true` if either the side to play is in check, or has lost due to a checkmate and `false` otherwise.

`move.play()`
---

This will modify the board to play the move. Other moves will be invalidated and may cause weird effects until `move.unplay()` is called.

`move.unplay()`
---

This will undo the move if it was the last move played. Otherwise, it might cause unexpected effects.

`board.toJSON()`
---

Creates an object that can be serialized as JSON. Note that this object should be viewed as opaque and it is not suitable for persistent storage, since it might change with updates to the project.

`fromJSON(board)`
---

Recreates a board from its serialized form.
