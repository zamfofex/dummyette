documentation for `streams-browser.js`
===

table of contents
---

- introduction
- WHATWG stream to `LiveStream`
  - `fromBrowserStream(browserStream)`
  - `splitBrowserStream(browserStream, separator, handle)`

introduction
---

This module is meant to allow for `LiveStream` and `RewindStream` objects to interoperate with WHATWG streams by converting to and from them.

`fromBrowserStream(browserStream)`
---

Converts a WHATWG stream to a `LiveStream` with the same values.

`splitBrowserStream(browserStream, separator, handle)`
---

Returns a `LiveStream` of `Uint8Array` values from a WHATWG stream by splitting it using the `separator` iterable. `separator` needs to be a sync iterable, async iterables won’t work. The values produced by the iterable will be coerced to possible byte values.

Note: Currently, the `separator` iterable must produce *exactly* one value, but this restriction is planned to be lifted eventually.

The `handle` parameter may be optionally given, and in that case, it should be a function to handles an error in case it happens on the stream.
