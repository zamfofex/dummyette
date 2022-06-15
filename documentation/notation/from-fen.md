documentation for `notation/from-fen.js`
===

table of contents
---

- introduction
- parsing
  - `toBoard(string)`

introduction
---

This module contains functions to convert values from `chess.js` to SAN.

`toBoard(string)`
---

Creates a board based on a FEN string. This will return `undefined` if the string couldn’t be parsed.
