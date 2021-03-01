`streams-browser.js` examples
===

High level streams can be useful, but some platforms have an abstraction for low level streams of data, and we might want to convert between them. One such low level stream implementations is WHATWG streams, which is used with some APIs like `fetch`.

`splitBrowserStream(browserStream, separator)` is a function that takes a WHATWG stream and a separator iterable (e.g. an array) and produces a `LiveStream` of `Uint8Array` containing the bytes separated by the given separator.

~~~ JavaScript
import {splitBrowserStream} from ".../dummyette/streams-browser.js"

let response = await fetch("https://...")

// Split the WHATWG stream into a ‘LiveStream’ of lines
let lines = splitBrowserStream(response.body, [0x0A])

for await (let line of lines)
{
	// Show the lines as they arrive in the stream.
	console.log(line)
}
~~~
