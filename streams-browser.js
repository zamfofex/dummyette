/// <reference path="./types/streams-browser.d.ts" />
/// <reference types="./types/streams-browser.d.ts" />

import {LiveController} from "./streams.js"

export let splitBrowserStream = (browserStream, [...separator]) =>
{
	separator = new Uint8Array(separator)
	
	// TODO: Support separators of different lengths.
	if (separator.length !== 1) return
	separator = separator[0]
	
	let {stream, push, finish, isFinished} = LiveController()
	
	let reader = browserStream.getReader()
	
	; (async () =>
	{
		let buffers = []
		while (true)
		{
			let {done, value} = await reader.read()
			if (done) value = [separator]
			
			if (isFinished()) { reader.cancel() ; return }
			
			let buffer = new Uint8Array(value)
			for (let i = 0 ; i < buffer.length ; i++)
			{
				if (buffer[i] !== separator) continue
				
				buffers.push(buffer.subarray(0, i))
				buffer = buffer.subarray(i + 1)
				i = -1
				push(joinBuffers(buffers))
				buffers = []
			}
			
			buffers.push(buffer)
			
			if (done) break
		}
		
		finish()
	})()
	
	return stream
}

let joinBuffers = buffers =>
{
	let length = 0
	for (let buffer of buffers) length += buffer.length
	
	let result = new Uint8Array(length)
	let offset = 0
	for (let buffer of buffers)
		result.set(buffer, offset),
		offset += buffer.length
	
	return result
}

export let fromBrowserStream = browserStream =>
{
	let {stream, push, finish, isFinished} = LiveController()
	
	let reader = browserStream.getReader()
	
	; (async () =>
	{
		let buffers = []
		while (true)
		{
			let {done, value} = await reader.read()
			if (done) break
			if (isFinished()) { reader.cancel() ; return }
			push(value)
		}
		
		finish()
	})()
	
	return stream
}
