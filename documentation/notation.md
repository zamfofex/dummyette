documentation for `notation.js`
===

table of contents
---

- introduction
- SAN
  - `toSAN(move)`
  - `fromSAN(board, name)`
- FEN
  - `toFEN(board)`
  - `fromFEN(string)`
- PGN
  - `fromPGN(stream)`
  - `fromSinglePGN(stream)`, `await fromSinglePGN(stream)`

introduction
---

This module contains functions to convert values from `chess.js` to and from standard formats. It is a convenience module, reexporting functions from other specialized modules.

`toSAN(move)`
---

Converts a move to its SAN form as a string. This is an alias to `fromMove` from the [`notation/to-san.js`](notation/to-san.md) module.

`fromSAN(board, name)`
---

This function converts a string from SAN/UCI notation to a move, returning undefined if the move could not be parsed. It is an alias to `toMove` from the [`notation/from-san.js`](notation/from-san.md) module.

`toFEN(board)`
---

This will convert a board to its FEN representation as a string. It is an alias to `fromBoard` from the [`notation/to-fen.js`](notation/to-fen.md) module.

`fromFEN(string)`
---

Creates a board based on a FEN string. This will return `undefined` if the string couldn’t be parsed. This is an alias to `toBoard` from the [`notation/from-fen.js`](notation/from-fen.md) module.

`fromPGN(stream)`
---

Creates a PGN game array or stream from a FEN string or stream. This will return `undefined` if the input couldn’t be parsed. This is an alias to `toGames` from the [`notation/from-pgn.js`](notation/from-pgn.md) module.

`fromSinglePGN(string)`, `await fromSinglePGN(stream)`
---

Ensures that there is a single PGN game in a string or stream and returns it or a promise that resolves to it (or to `undefined` if the game could not be parsed). This function is an alias to `toGame` from the [`notation/from-pgn.js`](notation/from-pgn.md) module.
