documentation for `lichess.js`
===

table of contents
---

- introduction
- Lichess connections
  - `await Lichess(token)`, `await Lichess({origin, token})`
  - `lichess.username`
  - `lichess.origin`
- challenges
  - `lichess.challenges`
  - `challenge.id`
  - `challenge.color`
  - `await challenge.accept()`
  - `await challenge.decline(reason)`
  - `challenge.rated`
  - `challenge.timeControl`
  - `challenge.speed`
  - `challenge.variant`
  - `lichess.acceptChallenges()`
  - `lichess.declineChallenges(reason)`
- games
  - `await lichess.getGame(id)`
  - `await lichess.getGameIDs()`
  - `await lichess.getGames()`
  - `await lichess.getUsernameGameIDs(username)`
  - `await lichess.StockfishGame(level, color)`
  - `await lichess.challenge(username, {rated, time, color})`
  - `game.id`
  - `game.rated`
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
- users
  - `await lichess.getBotUsernames()`
- chat
  - `game.chat`
  - `await chat.send(message)`

introduction
---

This module can be used to interface with Lichess’ APIs to interact with chess games on the website, both ongoing and past.

`await Lichess(token)`, `await Lichess({origin, token})`
---

This function will return a promise that resolves with a connection to Lichess given an access token. The promise will resolve to `undefined` if the connection could not be established.

`origin` represents the base Lichess URL, and can be used to connect to alternate Lichess instances. If it is omitted, it will default to `"https://lichess.org"`.

`lichess.username`
---

This will be a string with the username of the account of the connection.

Note: This is what Lichess calls a “user id”.

`lichess.origin`
---

The base URL passed in as an argument to create this connection object after URL normalization.

`lichess.challenges`
---

This will be a `LiveStream` of incoming challenges on the connection.

`challenge.id`
---

This will be the id of the challenge. This will match the id of the resulting game, and is what appears on the URL of Lichess games.

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

`challenge.speed`
---

This will be a string representing the speed of the game, e.g. `"rapid"`.

`challenge.variant`
---

Which chess variant the game will be. Currently, this can only be `"standard"`, `"chess960"` and `"fromPosition"`.

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

`await lichess.getUsernameGameIDs(username)`
---

This function will return a promise that resolves to an array with IDs of all past and ongoing games of the user with the given username.

The promise may resolve to `undefined` if there was an error such as the user not existing.

`await lichess.StockfishGame(level, color)`
---

Starts a game against Stockfish and returns a promise that resolves to it. `level` must be an integer between 1 and 8 (inclusive), and if it is not given, it will default to `1`. `color` should be either `"white"`, `"black"` or `"random"`, and if it is not given, it’ll default to `"random"`.

`await lichess.challenge(username, {rated, time, color})`
---

Sends a challenges to the player with the given username.

`rated` is a boolean indicating whether the game will be rated, `time` is either a string or an object indicating the game’s time cotnrol, and `color` shoudl be either `"white"`, `"black"` or `"random"`, indicating the color the bot will play as.

As a string, `time` can either be a in the form `"{n}d"` where `{n}` idicates the maximum number of days to make a move in a correspondence game, the string `"unlimited"`, representing a game without a time limit or `{limit}+{increment}` where `{limit}` is the starting time limit in minutes and `{increment}` is the increment in minutes. `limit` can additionally be given in the form `{minutes}:{seconds}` indicating the starting time will be the sum of `{minutes}` and `{seconds}` in their respective time measure. `{seconds}` does not need to be under 60.

As an object, `time` can contain a `time.limit` property and a `time.increment` property given in seconds. If neither property is specified, the game will have unlimited time control. Correspondence games besides unlimited games cannot be specified in this form.

`game.id`
---

This will be the id of the game, it is what appears on the URL of the game.

`game.rated`
---

This is a boolean representing whether the game is rated or not.

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

`await lichess.getBotUsernames()`
---

This function will return a promise that resolves to an array with the usernames of bots currently online.

`game.chat`
---

This represent the game’s player chat channel object. Currently the only operation that can be done with it is sending a message.

`await chat.send(message)`
---

Sends a message to this chat channel. The promise will resolve to a boolean indicating whether the message was sent successfully.
