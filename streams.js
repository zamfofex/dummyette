let registry = new FinalizationRegistry(f => f())

let createController = type =>
{
	let past = []
	let finished = false
	let listeners = new Set()
	let controllerFinished = false
	
	let push = (...values) =>
	{
		if (values.length === 0) return
		
		if (controllerFinished)
		{
			console.error("Tried pushing an element to a finished stream controller, finalizing process.")
			Deno.exit(-1)
		}
		
		if (finished) throw new Error()
		
		if (type === "rewind") past.push(...values)
		
		for (let value of values)
		for (let accept of listeners)
			accept(value)
	}
	
	let finishedMarker = {}
	let onFinished = new Set()
	
	let finish = () => { finished = true ; for (let f of onFinished) f(finishedMarker) ; onFinished.clear() }
	
	let pushFrom = async iterable => { for await (let value of iterable) await tryPush(value) }
	
	let tryPush = (...values) =>
	{
		if (controllerFinished) return new Promise(() => { })
		push(...values)
	}
	
	let isFinished = () => controllerFinished
	
	let getIterator = () =>
	{
		let queue = [...past]
		let resolve
		
		let accept = value =>
		{
			if (resolve)
				resolve(value),
				resolve = null
			else
				queue.push(value)
		}
		
		listeners.add(accept)
		
		let iterate = async function * ()
		{
			while (true)
			{
				while (queue.length !== 0)
				{
					let queue2 = [...queue]
					queue = []
					for (let value of queue2) yield await value
				}
				if (finished) break
				let value = await new Promise(f => { resolve = f ; onFinished.add(f) })
				if (value === finishedMarker) break
				yield value
			}
		}
		
		// note: the declaration of ‘iterator’ needs to be in its own scope.
		// note: this is to avoid it being added to the closures of the previous functions.
		{
			let iterator = iterate()
			registry.register(iterator, () => listeners.delete(accept))
			return iterator
		}
	}
	
	let map = (f, {parallel = false} = {}) =>
	{
		parallel = Boolean(parallel)
		
		let {stream: other, tryPush, finish} = createController(type)
		
		; (async () =>
		{
			if (parallel)
				for await (let value of stream)
					await tryPush(f(value, past.length, stream))
			else
				for await (let value of stream)
					await tryPush(await f(value, past.length, stream))
			finish()
		})()
		
		return other
	}
	
	let filter = (f, options = {}) =>
	{
		let {stream, tryPush, finish} = createController(type)
		
		let mapped = map(async (value, index, stream) => ({value, boolean: Boolean(await f(value, index, stream))}), options)
		
		; (async () =>
		{
			for await (let {value, boolean} of mapped)
				if (boolean) await tryPush(value)
			finish()
		})()
		
		return stream
	}
	
	let takeWhile = f =>
	{
		let {stream: other, tryPush, finish} = createController(type)
		
		; (async () =>
		{
			for await (let value of stream)
			{
				if (!await f(value, past.length, stream)) break
				await tryPush(value)
			}
			finish()
		})()
		
		return other
	}
	
	let slice = (start = 0, length = Infinity) =>
	{
		start = Math.floor(start)
		length = Math.floor(length)
		
		// Handle 'NaN'.
		if (start !== start) return
		if (length !== length) return
		
		let {stream, tryPush, finish} = createController(type)
		
		; (async () =>
		{
			let iterator = getIterator()
			
			for (let i = 0 ; i < start ; i++)
				await iterator.next()
			
			for (let i = 0 ; i < length ; i++)
			{
				let {value, done} = await iterator.next()
				if (done) break
				await tryPush(value)
			}
			
			finish()
		})()
		
		return stream
	}
	
	let forEach = async (f, options = {}) => { await map(f, options).last }
	
	let reset = () => slice(past.length)
	
	let getLast = memoize(async () =>
	{
		let last
		for await (let value of stream) last = value
		return last
	})
	
	let getFirst = async () => { for await (let value of stream) return value }
	
	let at = index => slice(index).first
	
	let find = f => filter(f).first
	
	let flat = memoize(() => flatten(type, stream))
	let flatMap = (f, options = {}) => map(f, options).flat()
	
	// note: the declaration of ‘stream’ needs to be in its own scope.
	// note: this is to avoid it being added to the closures of the previous functions.
	{
		let stream =
		{
			[Symbol.asyncIterator]: getIterator,
			flat, flatMap, map, filter, forEach, takeWhile,
			at, slice, reset, find, type,
			get first() { return getFirst() },
			get last() { return getLast() },
			get length() { return past.length },
			get finished() { return finished },
		}
		
		Object.freeze(stream)
		
		registry.register(stream, () => controllerFinished = true)
		
		let controller = {stream, push, pushFrom, tryPush, finish, isFinished, get finished() { return controllerFinished }, }
		Object.freeze(controller)
		return controller
	}
}

export let LiveController = () => createController("live")
export let RewindController = () => createController("rewind")

let createStream = (type, iterables) =>
{
	let {stream, pushFrom, finish} = createController(type)
	let promises = iterables.map(iterable => pushFrom(iterable))
	Promise.all(iterables).then(finish)
	return stream
}

export let LiveStream = (...iterables) => createStream("live", iterables)
export let RewindStream = (...iterables) => createStream("rewind", iterables)

let flatten = (type, iterables) =>
{
	let {stream, pushFrom, finish} = createController(type)
	; (async () =>
	{
		for await (let iterable of iterables)
			await pushFrom(iterable)
		finish()
	})()
	return stream
}

export let LiveJoinStream = (...iterables) => flatten("live", iterables)
export let RewindJoinStream = (...iterables) => flatten("rewind", iterables)

let memoize = f =>
{
	let value
	let g = () => { value = f() ; g = () => value ; return value }
	return () => g()
}
