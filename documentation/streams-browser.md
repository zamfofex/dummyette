documentation for `streams-browser.js`
===

table of contents
---

- introduction
- WHATWG stream to `LiveStream`
  - `splitBrowserStream(browserStream, separator)`

introduction
---

This module is meant to allow for `LiveStream` and `RewindStream` objects to interoperate with WHATWG streams by converting to and from them.

`splitBrowserStream(browserStream, separator)`
---

Returns a `LiveStream` of `Uint8Array` values from a WHATWG stream by splitting it using the `separator` iterable. `separator` needs to be a sync iterable, async iterables won’t work. The values produced by the iterable will be coerced to possible byte values.

Note: Currently, the `separator` iterable must produce *exactly* one value, but this restriction is planned to be lifted eventually.
