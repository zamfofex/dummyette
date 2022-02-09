`dummyette.js` examples
===

This module can be used to parse Polyglot `.bin` opening books. The opening book can be used to find moves to be played for a given board and weights that indicate how frequently it should be played.

An opening book first needs to be loaded from somewhere. In this case, we load it from a file using `await Deno.readFile(...)` which returns a `Uint8Array` that we can use to create an opening book object.

~~~ JavaScript
import {OpeningBook} from ".../dummyette/openings.js"

let bytes = await Deno.readFile(".../openings.bin")

let openings = OpeningBook(bytes)
~~~

Once we have our opening book set up, we can the lookup moves in it from board positions:

~~~ JavaScript
import {standardBoard} from ".../dummyette/chess.js"

let moves = openings.lookup(standardBoard)
~~~

Each “move” object in the `moves` array will contain two properties:

- `move.name` — the move’s UCI name
- `move.weight` — loosely, how frequently the move should be played in a game

~~~ JavaScript
for (let {move, weight} of moves)
{
	console.log(`${name} - ${weight}`)
}
~~~
