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

Sets up a connection with lichess and keeps rejecting all incoming challenges. Ignores all ongoing games.

the `resign` action
---

~~~
deno run -A .../dummyette/main.js resign "$id"
~~~

Resigns the game with the given id and exits.

the `start` action
---

~~~
deno run -A .../dummyette/main.js start "$level"
~~~

Starts a game against Stockfish at the given level and exits once the game is over. If the level is not given explicitly, it is assumed to be `1`. Rejects any incoming challenges during the game.

the `continue` action
---

~~~
deno run -A .../dummyette/main.js continue "$id"
~~~

Continues a previous game with the given id and exits once the game is over. Rejects any incoming challenges during the game.

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
deno run -A .../dummyette/main.js wait play "${levels[@]}"
~~~

Similar to the `wait` action, but this will additionally begin games against Stockfish sequentially. The Stockfish level of each game will be randomly chosen between the given levels.

If no levels are specified, the level chosen will always be 1.

parallelization <br> the `async` specifier
---

~~~
deno run -A .../dummyette/main.js async "$worker_count" ..."
~~~

By default, the bot will perform move analyses synchronously on the main thread. This can be changed by using the `async` specifier.

The maximum number of workers used can be given, but it can also be elided. If it is elided, the number of cores in the CPU will be used to determine how many workers to use.

specifying the access token <br> the `token` specifier
---

By default, the lichess access token is identified through the `lichess_token` environment variable. This can be changed by specifying `token` as the first argument to the program followed by a means of identifying the token. The action can be specified after the token information.

- `deno run -A .../dummyette/main.js token env "$name" ...` — uses the environment variable with the given name as the token.
- `deno run -A .../dummyette/main.js token given "$token" ...` — uses the given argument as the token.
- `deno run -A .../dummyette/main.js token prompt ...` — prompts for the token on stdin.

opening book <br> the `openings` specifier
---

~~~
deno run -A .../dummyette/main.js openings "$openings_path" ...
~~~

By default, no opening book is used. One can be specified using the `openings` specifier. An opening book is a JSON file containing information about openings that the bot will use.

TODO: Explain the opening book format more thoroughly.

specifier ordering
---

The `async`, `token` and `openings` specifiers must appear in that specific order. Some or all of them may be absent, however.

required Deno permissions
---

The only permission that is always required to run the bot is `--allow-net=lichess.org`. However, note that `--allow-env=lichess_token` might also be required if a different means of identifying the token is not provided.

It is also necessary to provide the `--allow-read` permission to the opening book file if it is specified.

When using the `async` specifier, it is also necessary to give `--allow-read` or `--allow-net` permission to the bot’s directory (depending on whether it is stored locally or has been run from HTTP) so that the workers can be started appropriately.

~~~
deno run --allow-net=lichess.org .../dummyette/main.js token prompt wait
~~~
