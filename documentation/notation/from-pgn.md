documentation for `notation/from-pgn.js`
===

table of contents
---

- introduction
- parsing
  - `toGames(string)`, `toGames(stream)`
  - `toGame(string)`, `await toGame(stream)`
  - `toFirstGame(string)`, `await toFirstGame(stream)`

introduction
---

This module contains functions to parse PGN games.

`toGames(string)`, `toGames(stream)`
---

Creates a PGN game array or stream from a FEN string or stream.

The input can be either a string or an iterable of strings (synchronous or asynchronous). In the case it is an asynchronous iterable, the result will be a `LiveStream` of the processed games, otherwise, it will be an array.

The resulting array or stream will be consisted of objects containing `game.info` (with the tag pairs as an object), `game.tags` (with the tag pairs as a list of entries), `game.result` (either `"1-0"`, `"0-1"`, `"1/2-1/2"`, or `"*"`), and `game.deltas` (an array of deltas).

If a given game cannot be parsed correctly, a value of `undefined` will be in its place in the resulting array or stream. If the parse error is deemed recoverable, further games might appear in the stream after such `undefined` entry, otherwise the array or stream will end right then after the `undefined` entry.

A *delta* is an object containing `delta.move` (a move played in the game), `delta.before` (the board before the move was played), `delta.after` (the board after the move was played), `delta.annotation` (the numeric annotation associated with the move or `0` is there was none), `delta.comments` (an array of comments associated with the move), and `delta.variations` (an array containing alternate lines from recursive annotation variations).

`toGame(string)`, `await toGame(stream)`
---

Similar to `toGames(...)`, except that only one game is allowed in the PGN stream/string. The value returned is a promise to a game if the input is a stream, and just a game if the input is a string.

`toFirstGame(string)`, `toFirstGame(stream)`
---

Similar to `toGame(...)`, except that mutliple games are allowed in the PGN stream/string, but only the first one is parsed and considered.
