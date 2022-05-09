documentation for `main.js`
===

table of contents
---

- introduction
- the `idle` action
- the `resign` action
- the `start` action
- the `continue` action
- the `wait` action
- the `wait play` action
- parallelization — the `async` specifier
- changing the base Lichess URL — the `origin` specifier
- specifying the access token — the `token` specifier
- opening book — the `openings` specifier
- specifier ordering
- required Deno permissions

introduction
---

This is the entrypoint module of the bot. It does not have any exports, but it ties the other modules together into a cohesive command line interface.

the `idle` action
---

~~~
deno run -A .../dummyette/main.js idle
~~~

Sets up a connection with Lichess and keeps rejecting all incoming challenges. This will ignore all ongoing games.

the `resign` action
---

~~~
deno run -A .../dummyette/main.js resign "$id"
~~~

Resigns the game with the given id and exits.

the `start` action
---

~~~
deno run -A .../dummyette/main.js start "$username"
~~~

Sends a challenge to the player with the given username. The username may be prefixed by `+` to indicate that the game will be rated. It may be suffixed by `/${color}` (a slash followed by a color) and also `:${time_control}` (a colon followed by a time control string), each optional, in that order.

The specified color must be either `white`, `black` or `random`, and will create a game where the bot plays as that color. The default color is `black`.

The given `time` option can be used to create a game with that time control. The time control format is the same as for the `lichess.challenge(...)` function of the `lichess.js` module.

The username may be replaced by a numeric string from 1 through 8, and that will instead start a game against Stockfish of that level. A `+` or time control has no effect then, but those might change in the future to either be an error or have an effect.

This will reject any incoming challenges during the game.

the `continue` action
---

~~~
deno run -A .../dummyette/main.js continue "$id"
~~~

Continues a previous game with the given id and exits once the game is over. This will reject any incoming challenges during the game.

the `wait` action
---

~~~
deno run -A .../dummyette/main.js wait
~~~

Pick all ongoing games back up, and keep accepting all incoming challenges that satisfy these criteria:

- The challenge is not rated.
- The opponent plays as the white pieces.
- The game is not a variant.
- The time control is “unlimited”.

the `wait play` action
---

~~~
deno run -A .../dummyette/main.js wait play "${usernames[@]}"
~~~

Similar to the `wait` action, but this will additionally send challenges to the players with the given usernames instead. It will send challenges to a random given player and wait for it to complete in a loop.

The player usernames will follow the same format as for the `play` action, and thus allow time information to be specified, as well as whether the game will be rated or not. It can also be used to start games against Stockfish.

If no username is specified, it will continue starting new games against Stockfish level 1 in a loop.

parallelization <br> the `async` specifier
---

~~~
deno run -A .../dummyette/main.js async "$worker_count" ...
~~~

By default, the bot will perform move analyses synchronously on the main thread. This can be changed by using the `async` specifier.

The maximum number of workers used can be given, but it can also be elided. If it is elided, the number of cores in the CPU will be used to determine how many workers to use.

changing the base Lichess URL <br> the `origin` specifier
---

~~~
deno run -A .../dummyette/main.js origin "$base_url" ...
~~~

By default, the base URL used to connect to Lichess is `https://lichess.org`. This can be changed, however, to support connecting to a different instance of Lichess.

specifying the access token <br> the `token` specifier
---

By default, the Lichess access token is identified through the `lichess_token` environment variable. This can be changed by specifying `token` as the first argument to the program followed by a means of identifying the token. The action can be specified after the token information.

- `deno run -A .../dummyette/main.js token env "$name" ...` — uses the environment variable with the given name as the token.
- `deno run -A .../dummyette/main.js token given "$token" ...` — uses the given argument as the token.
- `deno run -A .../dummyette/main.js token prompt ...` — prompts for the token on stdin.

opening book <br> the `openings` specifier
---

~~~
deno run -A .../dummyette/main.js openings "$openings_path" ...
~~~

By default, no opening book is used. One can be specified using the `openings` specifier. An opening book is a Polyglot `.bin` file that the bot will use for openings.

specifier ordering
---

The `async`, `origin`, `token` and `openings` specifiers must appear in that specific order. Some or all of them may be absent, however.

required Deno permissions
---

The only permission that is always required to run the bot is `--allow-net=lichess.org` (or conversely the origin of the base URL specified, if provided with the `origin` specifier). However, note that `--allow-env=lichess_token` might also be required if a different means of identifying the token is not provided.

~~~
deno run --allow-net=lichess.org .../dummyette/main.js token prompt wait
~~~

It is also necessary to provide the `--allow-read` permission to the opening book file if it is specified.

When using the `async` specifier, it is also necessary to give `--allow-read` or `--allow-net` permission to the bot’s directory (depending on whether it is stored locally or has been run from HTTP) so that the workers can be started appropriately.
