documentation for `openings.js`
===

table of contents
---

- introduction
- opening books
  - `OpeningBook(bytes)`
  - `openings.lookup(board)`

introduction
---

This module allows Polyglot `.bin` opening books to be parsed and used.

`OpeningBook(bytes)`
---

Parses and returns an opening book from a sequence of bytes. The `bytes` argument might be an `Uint8Array`, an `ArrayBuffer`, or a `DataView`.

`openings.lookup(board)`
---

Looks up the given board in the opening book. This will return an array containing objects with `name` and `weight` properties, which represent the move’s UCI name and its weight from the opening book.

The given board must be 8×8, otherwise this function will return `undefined`.
