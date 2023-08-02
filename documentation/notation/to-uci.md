documentation for `notation/to-uci.js`
===

table of contents
---

- introduction
- serialising
  - `fromMove(move)`

introduction
---

This module contains functions to convert to values from `chess.js` to UCI format.

`fromMove(move)`
---

Converts a move to UCI format, potentially following chess 960 notation for castling as indicated by the `chess960` argument.

