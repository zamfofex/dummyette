Dummyette
===

[lichess]: https://lichess.org
[Dummyette]: https://lichess.org/@/Dummyette
[Deno]: https://deno.land

Dummyette is a [lichess] bot. It is not that great at chess, but it is reasonably decent. It can beat Stockfish at level 2 the vast majority of times, and although it is not able to beat level 3, it is generally able to get to late in the middlegame before eventually losing.

You might be able to [play Dummyette on lichess][Dummyette] if you catch it online. Note that it will **only accept challenges that meet these criteria**:

- The challenge is not rated.
- Dummyette gets to play as the black pieces.
- The game is not a variant.
- The time control is “unlimited”.

As a program, Dummyette is written in JavaScript for [Deno]. It has no external library dependencies!

As a project, Dummyette is separated into a couple modules, each specialized in a specific kind of functionality that come together to form the bot.

- [`main.js`](main.js) [[reference](documentation/main.md) | [tutorial](examples/main.md)] <br>
  The command line interface entrypoint of the bot.
- [`dummyette.js`](dummyette.js) [[reference](documentation/dummyette.md) | [tutorial](examples/dummyette.md)] <br>
  The AI algorithm used to rate the quality of moves in a position.
- [`chess.js`](chess.js) [[reference](documentation/chess.md) | [tutorial](examples/chess.md)] <br>
  Utilities for interacting with chess boards and finding valid moves.
- [`fast-chess.js`](fast-chess.js) [[reference](documentation/fast-chess.md) | [tutorial](examples/fast-chess.md) (incomplete)] <br>
  Limited utilities for interacting with mutable chess boards (for performance).
- [`lichess.js`](lichess.js) [[reference](documentation/lichess.md) | [tutorial](examples/lichess.md)] <br>
  Interface for interacting with lichess through its bot API.
- [`streams.js`](streams.js) [[reference](documentation/streams.md) | [tutorial](examples/streams.md) (slightly incomplete)] <br>
  High level API for handling streams of data, e.g. the network.
- [`streams-browser.js`](streams-browser.js) [[reference](documentation/streams-browser.md) | [tutorial](examples/streams-browser.md)] <br>
  Interoperation between streams from the `streams.js` module and [WHATWG streams](https://streams.spec.whatwg.org).

more stuff
---

There are other projects directly related to Dummyette that don’t fit into this repository. Either because they are out of scope or because not as much effort was put into them. Still, they may be interesting, so they are listed below!

- [Dummyette on Discord](https://gist.github.com/zamfofex/b9dc6375b3f4eb3798a536841ea7354d) <br>
  A Discord bot that uses Dummyette’s APIs to allow you to play chess on [Discord].
- [`faster-chess.js` for Dummyette](https://gist.github.com/zamfofex/54caa0027867edc1a15b57af67835bff) <br>
  Faster valid move computations using [Ellie Moore’s][Ellie Moore] fantastic [Charon] perft compiled to WebAssembly.

[Ellie Moore]: <https://github.com/RedBedHed>
[Charon]: <https://github.com/RedBedHed/Charon>
[Discord]: <https://discord.com>

contributing
---

Any kind of contribution is welcome! Among other things, *programming, reporting issues, sharing ideas, or even just showing interest* are things that are very appreciated.

license
---

[0BSD © zamfofex](license.md)
