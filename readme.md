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

- [`main.js`](main.js) [[reference](documentation/main.md) | [tutorial](examples/main.md)]
  — The command line interface entrypoint of the bot.
- [`dummyette.js`](dummyette.js) [[reference](documentation/dummyette.md) | [tutorial](examples/dummyette.md)]
  — The AI algorithm used to rate the quality of moves in a position.
- [`chess.js`](chess.js) [[reference](documentation/chess.md) | [tutorial](examples/chess.md)]
  — Utilities for interacting with chess boards and finding valid moves.
- [`lichess.js`](lichess.js) [[reference](documentation/lichess.md) | [tutorial](examples/lichess.md)]
  — Interface for interacting with lichess through its bot API.
- [`streams.js`](streams.js) [[reference](documentation/streams.md) | [tutorial](examples/streams.md) (slightly incomplete)]
  — High level API for handling streams of data, e.g. the network.
- [`streams-browser.js`](streams-browser.js) [[reference](documentation/streams-browser.md) | [tutorial](examples/streams-browser.md)]
  — Interoperation between `streams.js` streams and [WHATWG streams](https://streams.spec.whatwg.org).

contributing
---

Any kinds of contribution are welcome! Among other things, *programming, reporting issues, sharing ideas, or even just showing interest* are things that are very appreciated.

license
---

[0BSD © Zamfofex](license.md)
