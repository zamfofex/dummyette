documentation for `dummyette.js`
===

table of contents
---

- introduction
- game analysis
  - `AsyncAnalyser({workers})`
  - `await analyser.analyse(board)`
  - `await analyser.evaluate(board)`
  - `await analyse(board, {workers, time})`
  - `await evaluate(board, {workers, time})`
  - `evaluation.move`, `evaluation.score`

introduction
---

This module contains functions that analyse a chess board to find the best moves available.

`AsyncAnalyser({workers})`
---

Creates an analyser that can perform the analysis in parallel using multiple workers. The `workers` argument determines how many workers will be used at most. If the argument is elided, it will be inferred automatically from the number of cores in the system.

`await analyser.analyse(board, {time})`
---

This function tries to find the best moves available on a given chess board. It completely fails at that, but it tries at least! It will return a promise that resolves to an array containing all valid moves for the board in order of quality, from best to worst.

The `time` argument is optional, and it will have a sensible default (currently 60 seconds, but that is subject to change across versions). The analysis performs iterative deepening, such that the promise resolves roughly after the given amount of time (in seconds). It may exceed the given time, however, most likely, it will resolve under the given threshold.

`await analyser.evaluate(board, {time})`

Similar to `await analyser.analyse(board)`, except that it will return a promise that resolves to an array of evaluations. An evaluation cotains information about the move’s analysed score.

`await analyse(board, {workers, time})`
---

Shortcut to `await analyser.analyse(board, {time})`, but note that new workers will be created on every call to this function.

`await evaluate(board, {workers, time})`
---

Similar to `await analyser.evaluate(board, {time})`, with the same difference and caveat as `await analyse(board, {workers, time})`.

`evaluation.move`, `evaluation.score`
---

These properties represent the evaluations’s move and the score attributed to it respectively. A higher score means the move is more likely to cause a win for the current side to play.

Currently, scores are given in *pawns* (i.e. a score of 0.5 equals 50 centipawns), but that might change in the future.
