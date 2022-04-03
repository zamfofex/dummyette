`lichess.js` examples
===

This module serves as a way to interface with Lichess through its API. With it, you can establish connections to the website, and interact with games and incoming challenges.

Note: Currently, this will only work well with bot accounts.

Before you can get started, you need an access token for your bot account. You can generate one by logging into your bot account and browsing to <https://lichess.org/account/oauth/token/create>.

Once you have your token set up, you can establish a connection to Lichess by using the `Lichess(token)` function. Once you call it, it’ll immediately start trying to connect and return a promise. Once it succeeds, this promise will resolve with a Lichess connection object. If there is a network error, the promise will reject, but if the connection was refused by Lichess (e.g. because your token is wrong), it’ll resolve to `undefined`.

~~~ JavaScript
import {Lichess} from ".../dummyette/lichess.js"

let lichess = await Lichess("Bearer XXXXX")
~~~

Now that we have set up a Lichess connection, we can start interacting with it. One of the easiest way to try it out is by using the `lichess.StockfishGame(level, color)` function to start a game against Stockfish. It’ll return a promise that resolves with the game object once it starts. We can pass it the Stockfish level, as well as the color we want for the bot to play as.

~~~ JavaScript
let game = await lichess.StockfishGame(4, "black")
~~~

Since the game just started, we can very easily start playing it by passing UCI move names to it.

~~~ JavaScript
// Make a couple bad starting moves.
await game.play("g8h6")
await game.play("b8a6")
await game.play("f7f6")
await game.play("d7d6")
~~~

We’ll also probably want to react to opponent moves instead of making moves in the dark. One way to do that is by using the `game.board`, which will be a board with the current game position. The problem is that we don’t have a good way to actually know when the board changes (e.g. because the opponent made a move). A better way is to use the `game.history`, `game.moveNames`, and `game.boards` properties, which are `RewindStream` objects of information about the state of the game as it changes.

`game.history` will contain complete history entries, including the name of the move played, the resultant board, the color of the player who made the move, etc. Note that the initial board position will *not* appear in the history, as no move has been performed by that point.

`game.moveNames` is just a shortcut for extracting move names from the entries in `game.history`. `game.boards` is also a similar shortcut, but note that it will additionally contain the initial board position at the start!

We can easily make our bot play random moves until the game ends.

~~~ JavaScript
for await (let board of game.boards)
{
	if (board.turn !== "black") continue
	await game.play(board.moves[Math.floor(Math.random() * board.moves.length)].name)
}
~~~

This works well if the game has just started (e.g. we just accepted a challenge or just created the game against Stockfish like above). But if we actually picked up an ongoing game, the `game.boards` stream is already going to have boards for the past moves in it (since it is a `RewindStream`).

What that means is that our bot is going to spend time finding random moves for past board positions. In this case, this is not too problematic, since trying to make moves that are curently invalid won’t do anything, but when actually analysing the game, it can waste a lot of time on positions that are not current. In addition, if the name for a move it finds for a past positon forms a valid move for the *current* position, it’ll be played in the current position, which is probably not what is intended.

We can move ahead to the current position by using the `stream.slice(...)` function to skip the past moves.

Also, in addition, If we don’t know which color our bot is playing as, we can figure it out through the `game.whiteUsername`, `game.blackUsername` and `lichess.username` properties.

~~~ JavaScript
let ourColor
if (lichess.username === game.whiteUsername)
	ourColor = "white"
else
	ourColor = "black"

for await (let board of game.boards.skip(game.boards.length - 1))
{
	if (board.turn !== ourColor) continue
	await game.play(board.moves[Math.floor(Math.random() * board.moves.length)].name)
}
~~~

Note that we use `game.boards.length - 1` here (as opposed to just `game.boards.length`) so that we avoid skipping the *current* board position.

However, although playing games against Stockfish can be interesting, sometimes we also want to play games against other players (humans and other bots). Currently, there is no mechanism to create a challenge, but we can handle incoming challenges.

The `lichess.challenges` is a `LiveStream` of incoming challenges. We can decide whether we want to accept or decline the challenge by using the `challenge.rated`, `challenge.timeControl`, and `challenge.color` properties. Once we want to consolidate the decision, we can use the `challenge.accept()` and `challenge.decline(reason)` functions.

The `challenge.decline(reason)` function takes an optional string representing the reason for declining the challenge. Note that it *cannot* be any string, it must be one of the strings predicted by Lichess like `"later"` or `"noBot"`, etc. See <https://lichess.org/api#operation/challengeDecline> for accepted reason strings.

The `challenge.accept()` function will return a promise that resolves to a game that can be used as seen earlier. It might also resolve to `undefined` if the challenge could not be accepted.

There are also a couple shortcut functions that we can use to either decline or accept all incoming challenges, `lichess.declineChallenges(reason)` and `lichess.acceptChallenges()`.

Note, however, that there is a bit of an assymmetry between those functions. `lichess.declineChallenges(reason)` will return `undefined`, whereas `lichess.acceptChallenges()` will return a `LiveStream` of the games that originated from accepting those challenges.

Something worth noting is that once we establish the connection with Lichess, there might already be ongoing games (e.g. because a previous connection was interrupted before they finished). You can use the `lichess.getGameIDs()` function to get a promise that resolves to the id of all ongoing games, and `lichess.getGames()` to get a promise that resolves to an array of all games. Note that they will also include ongoing games started on this connection.

Note that the `lichess.getGames()` function can be expensive, because it’ll start listening for moves on every ongoing games, so you should be careful when using it.
