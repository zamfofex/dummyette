documentation for `streams.js`
===

table of contents
---

- introduction
- controllers
  - `LiveController()`, `RewindController()`
  - `controller.stream`
  - `controller.finish()`
  - `controller.push(...values)`
  - `controller.pushFrom(values)`
  - `controller.tryPush(...values)`, `await controller.tryPush(...values)`
  - `controller.finished`, `controller.isFinished()`
- streams
  - `stream.type`
  - `stream.finished`
  - `stream.map(transform, {parallel})`
  - `stream.filter(keep, {parallel})`
  - `stream.takeWhile(finished)`
  - `await stream.forEach(consume, {parallel})`
  - `stream.flat()`
  - `stream.flatMap(transform, {parallel})`
  - `await stream.at(index)`
  - `await stream.first`
  - `await stream.last`
  - `await stream.find(suitable)`
  - `stream.slice(start, length)`
  - `stream.length`
  - `stream.reset()`
  - `stream[Symbol.asyncIterator]()`
  - `LiveStream(...iterables)`, `RewindStream(...iterables)`
  - `LiveJoinStream(...iterables)`, `RewindJoinStream(...iterables)`

introduction
---

This module allows for data streams (e.g. the network) to be handled conveniently and idiomatically.

`LiveController()`, `RewindController()`
---

These functions create a controller for a `LiveStream` and a `RewindStream`, respectively.

`controller.stream`
---

The stream being controlled.

`controller.finish()`
---

Finishes the controlled stream and prevents it from producing more values.

`controller.push(...values)`
---

Adds a value to the controlled stream. If the controller is finished, this will cause the process to end.

`controller.pushFrom(values)`
---

Adds all values from `values` to the controlled stream. This is similar to `push(values)`, but it also accepts async iterables.

`controller.tryPush(...values)`, `await controller.tryPush(...values)`
---

This is a convenience function to handle finished controllers. If the controller is not finished, this will push the values to it and return `undefined`. If the controller *is* finished, however, it’ll return a promise that never settles.

`controller.finished`, `controller.isFinished()`
---

These members are aliases, `controller.finished` is the same as `controller.isFinished()`.

Whether the controller is finished or not, `true` or `false`. A controller is finished when there is no interest in reading from its stream anymore, and there can never be again.

`stream.type`
---

This will be a string representing the type of the stream, either `"live"` or `"rewind"`.

`stream.finished`
---

Whether the stream is finished, `true` or `false`.

`stream.map(transform, {parallel})`
---

Transforms the stream using the given `transform` function. The function will be called for every value in this stream, and a new stream will be returned with the resultant values. If `transform` returns a promise, the resultant stream will contain the value it resolves to.

`parallel` controls what happens when values arrive at the originating stream before the previous promise returned by `transform` has settled. Ìf `parallel` is `true`, `transform` will be called as new values arrive, whereas if it is `false` (the default), only one such promise will be pending at a time.

In any case, the transformed values retain their position in the resultant stream.

`stream.filter(keep, {parallel})`
---

Filters some values out from the stream, returning a new stream without those values. `keep` should be a function that decides whether a value should be kept. If it returns a promise, the value it resolves to will be used instead. See the documentation for `stream.map(...)` for what `parallel` means.

`stream.takeWhile(finished)`
---

Finishes a stream preemptively. `finished` should be a function that decided whether the stream should end. The first value `finished` decides should end the stream will not be on the resulting stream, and the resulting stream will be finished. If `finished` returns a promise, the value it resolves to will be used instead.

`await stream.forEach(consume, {parallel})`
---

Calls `consume` for every value in the stream and returns a promise that resolves once the stream is finished.

`stream.flat()`
---

For streams containing iterables or async iterables, this will return new stream with the values produced by all such iterables in the order they appear in the originating stream.

`stream.flatMap(transform, {parallel})`
---

Shortcut for `stream.map(tranform, {parallel}).flat()`.

`await stream.at(index)`
---

Returns a promise that resolves to the value at the given index of the stream once it arrives. If the stream finishes without enough values, this will resolve to `undefined`.

`await stream.first`
---

Resolves to the first value available on the stream.

`await stream.last`
---

Once the stream is finished, this will resolve to the last value on the stream.

`await stream.find(suitable)`
---

Returns a promise that resolves with the first value that is deemed suitable by the argument function.

`stream.slice(start, length)`
---

Returns a new stream with `start` elements skipped, and that contains at most `length` elements. If unspecified, `length` will implicitly be `Infinity`, and `start` will implicitly be `0`.

`stream.length`
---

The number of values currently available on the stream.

`stream.reset()`
---

Returns a new stream without all values that are currently available on the stream. This is equivalent to `stream.slice(stream.length)`.

`stream[Symbol.asyncIterator]()`
---

Returns an interator for the stream so that it is an iterable and can be used with the `for await (... of ...)` construct.

`LiveStream(...iterables)`, `RewindStream(...iterables)`
---

Creates a new stream from multiple iterables or async iterables.

If the iterables are async, the values in the resulting stream will appear in the stream as soon as they are produced by the iterables.

`LiveJoinStream(...iterables)`, `RewindJoinStream(...iterables)`
---

Creates a new stream from multiple iterables or async iterables.

The values will appear in the resulting stream in the order they appear in the iterables. At most one iterable will be iterated at a time.
