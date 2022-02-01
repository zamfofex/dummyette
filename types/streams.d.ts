type It<Value> = Iterable<Value>|Iterator<Value>|AsyncIterable<Value>|AsyncIterator<Value>

type SomeController<T extends Type, Value> =
{
	stream: SomeStream<T, Value>,
	finish: () => undefined,
	push: (...values: Value[]) => undefined,
	pushFrom: (values: It<Value>) => undefined,
	tryPush: (...values: Value[]) => Promise<never>|undefined,
	finished: boolean,
	isFinished: () => boolean,
}

type SomeStream<T extends Type, Value> =
{
	type: T,
	finished: boolean,
	map: <Other>(transform: (value: Value) => Other|Promise<Other>, options?: {parallel: boolean}) => SomeStream<T, Other>,
	filter: (keep: (value: Value) => boolean|Promise<boolean>, options?: {parallel: boolean}) => SomeStream<T, Value>,
	takeWhile: (finished: (value: Value) => boolean|Promise<boolean>) => SomeStream<T, Value>,
	forEach: (consume: (value: Value) => void, options?: {parallel: boolean}) => undefined,
	flat: () => Value extends It<any> ? SomeStream<T, any> : never,
	flatMap: <Other>(transform: (value: Value) => It<Other>|Promise<It<Other>>, options?: {parallel: boolean}) => SomeStream<T, Other>,
	at: (index: number) => Promise<Value|undefined>,
	first: Value|undefined,
	last: Value|undefined,
	find: (suitable: (value: Value) => boolean) => Value|undefined,
	slice: (start?: number, length?: number) => SomeStream<T, Value>,
	length: number,
	reset: () => SomeStream<T, Value>,
	[Symbol.asyncIterator]: () => AsyncIterator<Value>,
}

export type Type = "live"|"rewind"

export type Controller<Value = any> = SomeController<Type, Value>
export type Stream<Value = any> = SomeStream<Type, Value>

export type LiveController<Value = any> = SomeController<"live", Value>
export type RewindController<Value = any> = SomeController<"rewind", Value>

export type LiveStream<Value = any> = SomeStream<"live", Value>
export type RewindStream<Value = any> = SomeStream<"rewind", Value>

// --- // --- //

export let LiveController: <Value>() => LiveController<Value>
export let RewindController: <Value>() => RewindController<Value>

export let LiveStream: <Value>(...iterables: It<Value>[]) => LiveStream<Value>
export let RewindStream: <Value>(...iterables: It<Value>[]) => RewindStream<Value>

export let LiveJoinStream: <Value>(...iterables: It<Value>[]) => LiveStream<Value>
export let RewindJoinStream: <Value>(...iterables: It<Value>[]) => RewindStream<Value>
