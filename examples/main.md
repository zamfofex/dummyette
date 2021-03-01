`main.js` examples
===

Note: All the examples here assume Bash (or similar), adapt as appropriate for you shell of choice.

This module is the entrypoint command line interface for the bot. You can use it to easily run the bot on lichess through your bot account token.

In order to get the bot to connect to lichess and start accepting challenges, you can use pass in `wait` as the only argument to the command. It’ll pick back up all ongoing games for its account and start accepting challenges for new games.

~~~
lichess_token="Bearer XXXXX" deno run -A .../dummyette/main.js wait
~~~

Note that the `lichess_token` variable will be used as the access token by default. But there are other ways to specify the token that don’t involve having to access environment variables. We can either specify it as a plain argument to the command, but also have it prompt for us to write it on stdin.

To use a plain argument, we have to pass in `token given` as the first two arguments to the command followed by our token. Notice that we still maintain the `wait` action *after* the token.

~~~
deno run -A .../dummyette/main.js token given "Bearer XXXXX" wait
~~~

If we want for it to prompt for the token on stdin, we can write `token prompt` as the first two arguments instead. Notice that we still keep the `wait` action after it.

~~~
deno run -A .../dummyette/main.js token prompt wait
~~~

Besides `wait`, there are other actions we can also specify. If we for it to start a game against Stockfish, we can use `start` as the action

~~~
lichess_token="Bearer XXXXX" deno run -A .../dummyette/main.js start
# Same as:
deno run -A .../dummyette/main.js token given "Bearer XXXXX" start
~~~

We can also specify the Stockfish level after `start`. Valid values are integers between 1 and 8 inclusively.

~~~
# We can export the ‘lichess_token’ environment variable so we don’t have to keep specifying it explicitly.
export lichess_token="Bearer XXXXX"

# Start a game against Stockfish level 3.
deno run -A .../dummyette/main.js start 3
~~~

We can also have it either pick up an ongoing game and continue playing it, or to resign it if it’s not interesting for us anymore.

~~~
deno run -A .../dummyette/main.js continue a0xXa0xX
deno run -A .../dummyette/main.js resign a0xXa0xX
~~~

But the `wait` action is likely the one we’d like to be able to set running as a daemon in a server. Note that the process might end for a variety of different reasons, including network errors, and potential bugs, so it can be useful to set it running in a loop.

~~~
while true
do deno run -A .../dummyette/main.js wait
done
~~~
