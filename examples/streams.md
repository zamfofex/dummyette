`streams.js` examples
===

Streams are async sequences of data that can be received. They can be used to represent things such as a network connection or GUI user interactions with a high level API.

Streams are similar to arrays, but you cannot modify them yourself, and the values arrive at them asynchronously.

In this module, there are two types of stream: *live streams* and *rewindable streams*. The difference between them is what happens when trying to interact with them when values have already arrived to them in the past. With live streams, the past values are discarded, and we cannot access them anymore. On the other hand, rewindable streams keep the values that arrive on them, so we can access them later.

Note that the two types of stream available in this module are *readable streams*. In effect, high‐level writable streams are just something you can pass data to as you want over time. That’s exactly what functions are, so there is no need to have an abstraction for them — if you want a “writable stream”, just use a function.

consuming streams
---

When some library we are using provides us with a stream and we want to be able to operate on the values on the stream, we will be *consuming* the stream.

One of the easiest ways to perform actions for the values in a stream is to use the `for await (... of ...)` statement. Every time a new value arrives at the stream, the body of the loop will be executed.

~~~ JavaScript
for await (let value of stream)
{
	console.log(value)
	// ...
}
~~~

For live streams, the body of the loop will only run for *new* incoming values, but for rewindable streams, the body will first execute for all available past values before actually waiting for new values. If we want to skip the past values, we can use `stream.slice(stream.length)`. `stream.length` is the number of past values available on the stream (which will always be `0` for live streams). There is also a shortcut `stream.reset()` function that does the same thing.

Another way of using streams is with the `stream.forEach(consume)` function. We can pass it a function, which will be called with the values from the stream, just like the `for await` loop we’ve seen.

Transforming streams looks very similar to tranforming arrays. We can use functions like `stream.map(transform)`, `stream.filter(keep)` to derive new streams. Note that this will not affect the existing stream, just like for arrays. The resulting stream will be of the same type as the originating stream.

Note: The word “type” here refers to the stream being either a rewind stream or a live stream.

The `stream.first` property is a promise that resolves to the first value of the stream once it arrives. It is a getter, so for live streams, this will actually be a promise that resolves to the very next value that arrives on the stream.

The `stream.last` property is a promise that’ll resolve to the last value that arrives once the stream finishes.

producing streams
---

Sometimes we might want to actually create streams for other dependent programs to use. Of course, we can just use `stream.map(...)`, `stream.flatMap(...)`, etc. on existing streams, and that works fine a lot of the time, but sometimes we don’t actually have an existing stream to work with, and we need to create one from scratch.

If you already have an async iterable or async iterator, such as the result of an async generator function, you can just pass it to the `LiveStream(iterable)` and `RewindStream(iterable)` functions to create the respective type of stream from that iterable.

Something interesting to note is that since streams are async iterables themselves, you can use these functions to convert between stream types. If you want to start holding the values of a live stream into a rewindable stream, just pass it to `RewindStream(...)`. Something *very important* to realize, though, is that using `LiveStream(...)` on a rewindable stream will not prevent it from keeping past values. The resultant stream will discard the values, but the original stream is still going to exist and keep holding the past values.

Additionally, you can also pass more than one iterable value to those functions. All the iterables are going to be iterated in parallel, and the resulting stream will contain the values from all the iterables *as they arrive*.

<!-- TODO: Explain how controllers work. -->

closing streams?
---

Streams cannot be closed explicitly. They are meant to be able to shared across different noncoordinated programs, and being able to close a stream from one program would impact its behavior in another program. Although streams are not “immutable” in a strict sense, they are still “immutable” in the sense that programs using them cannot change how they behave.

To represent disinterest in continuing to consume a stream, we can simply stop iterating them and drop them. Once the stream is inaccessible, it will be cleaned up by the JavaScript runtime, and its source of data will be closed automatically.

If e.g. producing values for a stream is too expensive and this model isn’t suitable, a stream producer can incorporate its own way for its consumers to close streams, but that is independent of the mechanisms provided to interact with streams in this module.

For example, suppose there is a function `createExampleStream()` that wants to return a stream whose values are expensive to produce. To allow for consumers to explicitly show disinterest in continuing to read from the stream, it could return the stream alongside a function that immediately finishes it.

~~~ JavaScript
let {finish, stream} = createExampleStream()

for await (let value of stream)
{
	if (!interested(value)) break
	// Use ‘value’ here.
	// ...
}

// Eagerly finishes the stream by showing explicit disinterest in it.
finish()
~~~

