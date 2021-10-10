documentation for `fast-chess.js`
===

table of contents
---

- introduction
- mutable boards
  - `MutableBoard(board)`
  - `board.getScore()`
  - `board.getMoves()`
- moves
  - `move.play()`
  - `move.unplay()`

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

`move.play()`
---

This will modify the board to play the move. Other moves will be invalidated and may cause weird effects until `move.unplay()` is called.

`move.unplay()`
---

This will undo the move if it was the last move played. Otherwise, it might cause unexpected effects.
