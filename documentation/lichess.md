documentation for `lichess.js`
===

table of contents
---

- introduction
- lichess connections
  - `await Lichess(token)`
  - `lichess.username`
- challenges
  - `lichess.challenges`
  - `challenge.id`
  - `challenge.color`
  - `await challenge.accept()`
  - `await challenge.decline(reason)`
  - `challenge.rated`
  - `challenge.timeControl`
  - `challenge.variant`
  - `lichess.acceptChallenges()`
  - `lichess.declineChallenges(reason)`
- games
  - `await lichess.getGame(id)`
  - `await lichess.getGameIDs()`
  - `await lichess.getGames()`
  - `await lichess.StockfishGame(level, color)`
  - `game.id`
  - `game.moveNames`, `game.moves`
  - `game.turn`
  - `game.status`, `game.ongoing`, `game.finished`
  - `game.color`
  - `await game.play(...names)`
  - `await game.resign()`
  - `game.boards`
  - `game.history`
  - `historyEntry.moveName`, `historyEntry.move`
  - `historyEntry.moveNumber`
  - `historyEntry.board`
  - `historyEntry.turn`

introduction
---

This module can be used to interface with lichess’ APIs to interact with chess games on the website, both ongoing and past.

`await Lichess(token)`
---

This function will return a promise that resolves with a connection to lichess given an access token. The promise will resolve to `undefined` if the connection could not be established.

`lichess.username`
---

This will be a string with the username of the account of the connection.

Note: This is what lichess calls a “user id”.

`lichess.challenges`
---

This will be a `LiveStream` of incoming challenges on the connection.

`challenge.id`
---

This will be the id of the challenge. This will match the id of the resulting game, and is what appears on the URL of lichess games.

`challenge.color`
---

This is the color the challenger wants to play as. This will be either `"white"`, `"black"`, or `"random"`. If it is `"random"`, it means the color will be chosen randomly when the challenge is accepted.

`await challenge.accept()`
---

This will try to accept the challenge. If it succeeds, the promise will resolve with the resulting game, otherwise the promise will resolve with `undefined`.

`await challenge.decline(reason)`
---

Thiss will try to decline the challenge with the given reason string. If it succeeds, the promise will resolve with `true`, otherwise the promise will resolve with `false`.

Note: The “reason string” is an enumerated string, and cannot be any arbitrary string. See <https://lichess.org/api#operation/challengeDecline>

`challenge.rated`
---

Whether the game will be rated or not, `true` or `false`.

`challenge.timeControl`
---

This will be a string representing the type of time control of the game, e.g. `"unlimited"`.

`challenge.variant`
---

Which chess variant the game will be. Currently, this can only be `"standard"`. Variant challenges will be declined automatically and never become a challenge object.

`lichess.acceptChallenges()`
---

This will automatically accept all incoming challenges (that are not chess variants) and return a `LiveStream` of all resultant games.

`lichess.declineChallenges(reason)`
---

This will automatically decline all incoming challenges. It will always return `undefined`.

`await lichess.getGame(id)`
---

Finds the game with the given id and returns a promise that resolves to the game object.

`await lichess.getGameIDs()`
---

Returns a promise that resolves to an array with the ids of all the ongoing games of the user of the connection.

`await lichess.getGames()`
---

Returns a promise that resolves to an array with the all the ongoing games of the user of the connection.

`await lichess.StockfishGame(level, color)`
---

Starts a game against Stockfish and returns a promise that resolves to it. `level` must be an integer between 1 and 8 (inclusive), and if it is not given, it will default to `1`. `color` should be either `"white"`, `"black"` or `"random"`, and if it is not given, it’ll default to `"random"`.

`game.id`
---

This will be the id of the game, it is what appears on the URL of the game.

`game.moveNames`, `game.moves`
---

These will be a `RewindStream` of the names of all the moves that have occured in the game insofar, in UCI format.

These two properties are aliases, `game.moveNames` is the same as `game.moves`.

`game.turn`
---

This is the side to play in the game. Either `"white"` or `"black"`.

`game.status`, `game.ongoing`, `game.finished`
---

These represent the current status of the game. `game.status` will be either `"ongoing"`, `"checkmate"`, `"draw"` or `"aborted"`.

`game.color`
---

This is the color that the user account of the connection used to create this game has in the game. If the account does not take part in the game, this will be `null`.

`await game.play(...names)`
---

Tries to play the moves with the given names on this game in sequence (in UCI format). It will return a promise that resolves with the number of moves that were played successfully.

`await game.resign()`
---

Tries to resign the game. Returns `true` if the game could be resigned successfully, and `false` otherwise.

`game.boards`
---

This will be a `RewindStream` of all the board postions that have occured in the game insofar.

`game.history`
---

This is a `RewindStream` containing information about the occurences of the game.

`historyEntry.moveName`, `historyEntry.move`
---

These two properties are aliases, they do the same. They are the name of the move that was played in this history entry.

`historyEntry.moveNumber`
---

The number of the move of this history entry.

`historyEntry.board`
---

The board position after the move of this entry was played.

`historyEntry.turn`
---

Which side played the move on this entry. Either `"white"` or `"black"`.
