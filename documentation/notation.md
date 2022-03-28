documentation for `notation.js`
===

table of contents
---

- introduction
- SAN
  - `toSAN(move)`

introduction
---

This module contains functions to convert values from `chess.js` to and from standard formats.

`toSAN(move)`
---

Converts a move to its SAN form as a string.

`fromFEN(string)`
---

Creates a board based on a FEN string. This will return `undefined` if the string couldn’t be parsed.
