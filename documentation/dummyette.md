documentation for `dummyette.js`
===

table of contents
---

- introduction
- game analysis
  - ~~`analyse(board)`~~
  - `AsyncAnalyser({workers})`
  - `await analyser.analyse(board)`
  - `await analyser.evaluate(board)`
  - `evaluation.move`, `evaluation.score`

introduction
---

This module contains functions that analyse a chess board to find the best moves available.

**Note:** Using the asynchronous API (which is the only non‐deprecated API) requires `--allow-read` or `--allow-net` in Deno (depending on whether it is run locally or from HTTP) to give it access to the project’s directory so that the workers can be started appropriately.

~~`analyse(board)`~~
---

This function is a synchronous variant of `analyser.analyse(...)`.

**Deprecated:** This function is deprecated and might be removed in the future.

`AsyncAnalyser({workers})`
---

Creates an analyser that can perform the analysis in parallel using multiple workers. The `workers` argument determines how many workers will be used at most. If the argument is elided, it will be inferred automatically from the number of cores in the system.

`await analyser.analyse(board)`
---

This function tries to find the best moves available on a given chess board. It completely fails at that, but it tries at least! It will return a promise that resolves to an array containing all valid moves for the board in order of quality, from best to worst.

`await analyser.evaluate(board)`

Similar to `await analyser.analyse(board)`, except that it will return a promise that resolves to an array of evaluations. An evaluation cotains information about the move’s analysed score.

`evaluation.move`, `evaluation.score`
---

These properties represent the evaluations’s move and the score attributed to it respectively. A higher score means the move is more likely to cause a win for the current side to play.

Currently, scores are given in *pawns* (i.e. a score of 0.5 equals 50 centipawns), but that might change in the future.
