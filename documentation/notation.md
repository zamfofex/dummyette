documentation for `notation.js`
===

table of contents
---

- introduction
- SAN
  - `toSAN(move)`
- FEN
  - `fromFEN(string)`
- PGN
  - `fromPGN(stream)`

introduction
---

This module contains functions to convert values from `chess.js` to and from standard formats. It is a convenience module, reexporting functions from other specialized modules.

`toSAN(move)`
---

Converts a move to its SAN form as a string. This is an alias to `fromMove` from the [`notation/to-san.js`](notation/to-san.md) module.

`fromFEN(string)`
---

Creates a board based on a FEN string. This will return `undefined` if the string couldn’t be parsed. This is an alias to `toBoard` from the [`notation/from-fen.js`](notation/from-fen.md) module.

`fromPGN(stream)`
---

Creates a PGN game array or stream from a FEN string or stream. This will return `undefined` if the input couldn’t be parsed. This is an alias to `toGames` from the [`notation/from-pgn.js`](notation/from-pgn.md) module.
