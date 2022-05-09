Dummyette
===

[Lichess]: https://lichess.org
[Dummyette]: https://lichess.org/@/Dummyette
[Deno]: https://deno.land

Dummyette is a [Lichess] bot. It is not that great at chess, but it is reasonably decent. It can win against [Maia1] most times, and sometimes also [Maia5]. It has also won against [Maia9] occasionally.

[Maia1]: <https://lichess.org/@/maia1>
[Maia5]: <https://lichess.org/@/maia5>
[Maia9]: <https://lichess.org/@/maia9>

You might be able to [play Dummyette on Lichess][Dummyette] if you catch it online. Note that it will **only accept challenges that meet these criteria**:

- The game is not a variant. (Chess 960 and different starting positions are accepted, though!)
- The time control is not bullet.
- If the time control is correspondence (including unlimited), the game isn’t rated.

As a program, Dummyette is written in JavaScript for [Deno]. It has no external library dependencies!

As a project, Dummyette is separated into a couple modules, each specialized in a specific kind of functionality that come together to form the bot.

- [`main.js`](main.js) [[reference](documentation/main.md) | [tutorial](examples/main.md)] <br>
  The command line interface entrypoint of the bot.
- [`dummyette.js`](dummyette.js) [[reference](documentation/dummyette.md) | [tutorial](examples/dummyette.md)] <br>
  The AI algorithm used to rate the quality of moves in a position.
- [`chess.js`](chess.js) [[reference](documentation/chess.md) | [tutorial](examples/chess.md)] <br>
  Utilities for interacting with chess boards and finding valid moves.
- ~~[`fast-chess.js`](fast-chess.js)~~ [deprecated] [[reference](documentation/fast-chess.md)] <br>
  Limited utilities for interacting with mutable chess boards (for performance).
- [`lichess.js`](lichess.js) [[reference](documentation/lichess.md) | [tutorial](examples/lichess.md)] <br>
  Interface for interacting with Lichess through its bot API.
- [`openings.js`](openings.js) [[reference](documentation/openings.md) | [tutorial](examples/openings.md)] <br>
  Parsing Polyglot `.bin` opening books.
- [`notation.js`](notation.js) [[reference](documentation/notation.md) | [tutorial](examples/notation.md)] <br>
  Converting `chess.js` datatypes to/from string formats.
- [`streams.js`](streams.js) [[reference](documentation/streams.md) | [tutorial](examples/streams.md) (slightly incomplete)] <br>
  High level API for handling streams of data, e.g. the network.
- [`streams-browser.js`](streams-browser.js) [[reference](documentation/streams-browser.md) | [tutorial](examples/streams-browser.md)] <br>
  Interoperation between streams from the `streams.js` module and [WHATWG streams](https://streams.spec.whatwg.org).

more stuff
---

There are other projects directly related to Dummyette that don’t fit into this repository. Either because they are out of scope or because not as much effort was put into them. Still, they may be interesting, so they are listed below!

- [Dummyette on Discord](https://gist.github.com/zamfofex/b9dc6375b3f4eb3798a536841ea7354d) <br>
  A Discord bot that uses Dummyette’s APIs to allow you to play chess on [Discord].
- [Dummyette in your browser](https://gist.github.com/zamfofex/d478de89883e1629ce21de5367b9bfdd) <br>
  Play Dummyette in your browser, no Deno required! (Only a simple HTTP server.)
- [UCI front end](https://gist.github.com/zamfofex/078a2bae37dbb60440093db30f816a63) <br>
  Simple (and currently partially incomplete) [UCI] front end for Dummyette, so that you can play Dummyette in your favorite chess GUI.

[Ellie Moore]: <https://github.com/RedBedHed>
[Charon]: <https://github.com/RedBedHed/Charon>
[Discord]: <https://discord.com>
[UCI]: <https://www.chessprogramming.org/UCI>

contributing
---

Any kind of contribution is welcome! Among other things, *programming, reporting issues, sharing ideas, or even just showing interest* are things that are very appreciated.

license
---

[0BSD © zamfofex](license.md)
