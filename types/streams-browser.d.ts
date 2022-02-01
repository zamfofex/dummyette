import {LiveStream} from "../streams.js"

export let splitBrowserStream: (browserStream: ReadableStream<Uint8Array>, separator: [number]) => LiveStream<Uint8Array>
