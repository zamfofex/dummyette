documentation for `dummyette.js`
===

table of contents
---

- introduction
- game analysis
  - `analyse(board)`
  - `AsyncAnalyser({workers})`
  - `await analyser.analyse(board)`

introduction
---

This module contains functions that analyse a chess board to find the best moves available.

`analyse(board)`
---

This function tries to find the best moves available on a given chess board. It completely fails at that, but it tries at least! It will return an array containing all valid moves for the board in order of quality, from best to worst.

`AsyncAnalyser({workers})`
---

Creates an analyser that can perform the analysis in parallel using multiple workers. The `workers` argument determines how many workers will be used at most. If the argument is elided, it will be inferred automatically from the number of cores in the system.

`await analyser.analyse(board)`
---

Similar to `analyse`, except that it uses workers to run the analysis in parallel and asynchronously.
