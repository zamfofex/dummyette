import {LiveStream} from "../streams.js"

export let splitBrowserStream: (browserStream: ReadableStream<Uint8Array>, separator: [number], handle?: (error: unknown) => unknown) => LiveStream<Uint8Array>
export let fromBrowserStream: <T>(browserStream: ReadableStream<T>) => LiveStream<T>
