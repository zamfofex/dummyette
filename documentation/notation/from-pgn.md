documentation for `notation/from-pgn.js`
===

table of contents
---

- introduction
- parsing
  - `toGames(stream)`

introduction
---

This module contains functions to convert values from `chess.js` to SAN.

`toGames(stream)`
---

Creates a PGN game array or stream from a FEN string or stream.

The input can be either a string or an iterable of strings (synchronous or asynchronous). In the case it is an asynchronous iterable, the result will be a `LiveStream` of the processed games, otherwise, it will be an array.

Note that there is a significant difference between those cases: If an asynchronous stream is passed in, the result will be a stream containing all of the games up to (but not including) the first one that could not be parsed. Whereas if it is either a string or a synchronous iterable, an array will be returned only if all the games could be parsed, otherwise `undefined` is returned.

For now, recursive annotation variations are simply ignored.

The resulting game array will be consisted of objects containing `game.info` (with the tag pairs as an object), `game.tags` (with the tag pairs as a list of entries), `game.result` (either `"1-0"`, `"0-1"`, `"1/2-1/2"`, or `"*"`), and `game.deltas` (an array of deltas).

A *delta* is an object containing `delta.move` (a move played in the game), `delta.before` (the board before the move was played), `delta.after` (the board after the move was played), `delta.annotation` the numeric annotation associated with the move (or `0` is there was none), and `delta.comments` (an array of comments associated with the move).