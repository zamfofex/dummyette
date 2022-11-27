/// <reference path="../types/notation/from-pgn.d.ts" />
/// <reference types="../types/notation/from-pgn.d.ts" />

import {standardBoard} from "../chess.js"
import {fromFEN, toSAN} from "../notation.js"
import {LiveController, LiveStream} from "../streams.js"

let eof = Symbol("EOF")

function * lexG(produce)
{
	let char = yield
	while (true)
	{
		if (char === eof) break
		
		switch (char)
		{
			case ";":
			{
				let lexeme = char
				while (true)
				{
					char = yield
					if (char === eof) break
					if (char === "\r") break
					if (char === "\n") break
					lexeme += char
				}
				produce(lexeme)
				char = yield
				break
			}
			
			case "{":
			{
				let lexeme = char
				while (true)
				{
					char = yield
					if (char === eof)
					{
						produce(eof)
						return
					}
					
					lexeme += char
					if (char === "}") break
				}
				produce(lexeme)
				char = yield
				break
			}
			
			case " ": case "\t":
				char = yield
				break
			
			case "\r": case "\n":
				char = yield
				if (char === "%")
				{
					let lexeme = char
					while (true)
					{
						char = yield
						if (char === eof) break
						if (char === "\r") break
						if (char === "\n") break
						lexeme += char
					}
					produce(lexeme)
					char = yield
				}
				break
			
			case '"':
			{
				let lexeme = char
				while (true)
				{
					char = yield
					if (char === eof)
					{
						produce(eof)
						return
					}
					
					let ch = char
					if (ch === "\\") char = yield
					
					if (char === eof)
					{
						produce(eof)
						return
					}
					
					lexeme += char
					if (ch === '"') break
				}
				produce(lexeme)
				char = yield
				break
			}
			
			case ".": case "*":
			case "[": case "]":
			case "(": case ")":
			case "<": case ">":
				produce(char)
				char = yield
				break
			
			case "$":
			{
				let lexeme = char
				while (true)
				{
					char = yield
					if (char === eof) break
					let cp = char.codePointAt()
					if (cp < 0x30) break
					if (cp > 0x39) break
					lexeme += char
				}
				if (lexeme === "$")
				{
					produce(eof)
					return
				}
				produce(lexeme)
				break
			}
			
			case "!": case "?":
			{
				let lexeme = char
				char = yield
				if (char === "!" || char === "?")
				{
					lexeme += char
					char = yield
				}
				produce(lexeme)
				break
			}
			
			default:
			{
				let lexeme = ""
				while (true)
				{
					let cp = char.codePointAt()
					if (cp < 0x41 || cp > 0x5A)
					if (cp < 0x61 || cp > 0x7A)
					if (cp < 0x30 || cp > 0x39)
					if (char !== "_")
					if (char !== "+")
					if (char !== "#")
					if (char !== "=")
					if (char !== ":")
					if (char !== "-")
					if (char !== "/")
						break
					
					lexeme += char
					char = yield
					if (char === eof) break
				}
				
				produce(lexeme)
				break
			}
		}
	}
}

function * tokeniseG(produce)
{
	while (true)
	{
		let value = yield
		if (value === eof) return
		switch (value[0])
		{
			case ";":
			case "{":
			case "%":
				produce({type: "comment", value})
				break
			
			case '"':
				produce({type: "string", value: value.slice(1, -1)})
				break
			
			case ".": case "*":
			case "[": case "]":
			case "(": case ")":
			case "<": case ">":
				produce({type: value, value})
				break
			
			case "$":
				produce({type: "annotation", value})
				break
			
			case "!":
			case "?":
				produce({type: "annotation", value})
				break
			
			default:
				if (/[^0-9]/.test(value)) produce({type: "symbol", value})
				else produce({type: "integer", value})
				break
		}
	}
}

function * skipComment()
{
	while (true)
	{
		let token = yield
		if (token === eof) return eof
		if (token.type === "comment") continue
		return token
	}
}

function * parseG(produce)
{
	let variations = []
	let produceMove = move =>
	{
		let variation = variations[variations.length - 1]
		if (!variation) produce(move)
		else variation.push(move)
	}
	
	let token = yield
	while (true)
	{
		if (token === eof)
		{
			if (variations.length !== 0) produce(eof)
			return
		}
		
		if (token.type === "symbol" || token.type === "*")
		if (["1-0", "0-1", "1/2-1/2", "*"].includes(token.value))
		{
			produceMove({type: "result", value: token.value})
			token = yield
			continue
		}
		
		switch (token.type)
		{
			default:
				produce(eof)
				return
			
			case "[":
			{
				if (variations.length !== 0)
				{
					produce(eof)
					return
				}
				
				let key = yield * skipComment()
				if (key === eof || key.type !== "symbol" && key.type !== "integer")
				{
					produce(eof)
					return
				}
				
				let value = yield * skipComment()
				if (value === eof || value.type !== "string")
				{
					produce(eof)
					return
				}
				
				let close = yield * skipComment()
				if (close === eof || close.type !== "]")
				{
					produce(eof)
					return
				}
				
				produce({type: "tag", value: [key.value, value.value]})
				token = yield
				break
			}
			
			case "integer":
			{
				while (true)
				{
					token = yield * skipComment()
					if (token === eof)
					{
						produce(eof)
						return
					}
					if (token.type !== ".") break
				}
				
				if (token.type !== "symbol")
				{
					produce(eof)
					return
				}
				
				// falls through
			}
			
			case "symbol":
			{
				let name = token.value
				let annotation = 0
				let comments = []
				
				while (true)
				{
					token = yield
					if (token === eof) break
					if (token.type !== "comment") break
					comments.push(token.value)
				}
				
				if (token?.type === "annotation")
				{
					if (token.value[0] === "$")
					{
						annotation = Number(token.value.slice(1))
					}
					else
					{
						if (token.value === "!") annotation = 1
						if (token.value === "?") annotation = 2
						if (token.value === "!!") annotation = 3
						if (token.value === "??") annotation = 4
						if (token.value === "!?") annotation = 5
						if (token.value === "?!") annotation = 6
					}
					
					while (true)
					{
						token = yield
						if (token === eof) break
						if (token.type !== "comment") break
						comments.push(token.value)
					}
				}
				
				produceMove({type: "move", value: {name, annotation, comments}})
				break
			}
			
			case "(":
				variations.push([])
				token = yield
				break
			
			case ")":
			{
				if (variations.length === 0)
				{
					produce(eof)
					return
				}
				let value = variations.pop()
				produceMove({type: "variation", value})
				token = yield
				break
			}
			
			case "comment":
				token = yield
				break
		}
	}
}

let toDelta = (node, board) =>
{
	let comments = [...node.value.comments]
	let annotation = node.value.annotation
	Object.freeze(comments)
	
	let move = board.moves.find(move => toSAN(move) === node.value.name)
	if (!move) return
	
	let delta = {before: board, move, after: move.play(), comments, annotation, variations: []}
	Object.freeze(delta)
	return delta
}

let fromVariation = (delta0, nodes) =>
{
	let board = delta0.before
	let delta
	
	let deltas = []
	delta0.variations.push(deltas)
	
	for (let node of nodes)
	{
		if (node.type === "variation")
		{
			if (!delta) return
			if (!fromVariation(delta, node.value)) return
			continue
		}
		
		delta = toDelta(node, board)
		if (!delta) return
		
		deltas.push(delta)
		board = delta.after
	}
	
	Object.freeze(deltas)
	
	return true
}

let freezeVariations = variations =>
{
	Object.freeze(variations)
	for (let deltas of variations)
		for (let delta of deltas)
			freezeVariations(delta.variations)
}

function * toGamesG(produce)
{
	while (true)
	{
		let node = yield
		if (node === eof) return
		
		let tags = []
		let info = {}
		let deltas = []
		let invalid = false
		
		while (node.type === "tag")
		{
			let tag = [...node.value]
			Object.freeze(tag)
			tags.push(tag)
			info[tag[0]] = tag[1]
			node = yield
			if (node === eof)
			{
				produce()
				return
			}
		}
		
		let board = standardBoard
		if (info.FEN !== undefined) board = fromFEN(info.FEN)
		
		while (node.type !== "result")
		{
			switch (node.type)
			{
				default:
					produce()
					return
				
				case "variation":
					if (deltas.length == 0)
					{
						produce()
						return
					}
					if (!invalid && !fromVariation(deltas[deltas.length - 1], node.value))
					{
						invalid = true
					}
					
					break
				
				case "move":
				{
					if (!invalid)
					{
						let delta = toDelta(node, board)
						if (delta)
						{
							board = delta.after
							deltas.push(delta)
						}
						else
						{
							invalid = true
						}
					}
					break
				}
			}
			
			node = yield
			if (node === eof)
			{
				produce()
				return
			}
		}
		
		if (invalid)
		{
			produce()
			continue
		}
		
		let result = node.value
		
		let game = {tags, info, deltas, result}
		Object.freeze(game)
		Object.freeze(tags)
		Object.freeze(info)
		Object.freeze(deltas)
		for (let delta of deltas)
			freezeVariations(delta.variations)
		
		produce(game)
	}
}

function * toGameG(produce)
{
	let game = yield
	if (game === eof || !game || (yield) !== eof) game = undefined
	produce(game)
}

function * toFirstGameG(produce)
{
	let game = yield
	if (game === eof) game = undefined
	produce(game)
}

let applySync = (input, f) =>
{
	if (input === undefined) return
	
	let result = []
	
	let g = f(value => result.push(value))
	g.next()
	
	for (let value of input)
	{
		if (value === eof) break
		let {done} = g.next(value)
		if (done) return result
	}
	while (true)
	{
		let {done} = g.next(eof)
		if (done) return result
	}
}

let applyAsync = (input, f) =>
{
	let controller = LiveController()
	
	let g = f(value => controller.tryPush(value))
	g.next()
	
	;(async () =>
	{
		for await (let value of input)
		{
			if (value === eof) break
			let {done} = g.next(value)
			if (done) return
		}
		while (true)
		{
			let {done} = g.next(eof)
			if (done) return
		}
	})().then(() => controller.finish())
	
	return controller.stream
}

let flatSync = stream =>
{
	if (typeof stream === "string") return stream
	let result = [...stream]
	if (result.some(string => typeof string !== "string")) return
	return result.join("")
}
let flatAsync = stream => LiveStream(stream).flat()

let lexSync = pgn => applySync(flatSync(pgn), lexG)
let tokeniseSync = pgn => applySync(lexSync(pgn), tokeniseG)
let parseSync = pgn => applySync(tokeniseSync(pgn), parseG)
let toGamesSync = pgn => applySync(parseSync(pgn), toGamesG)
let toGameSync = pgn => applySync(toGamesSync(pgn), toGameG)?.[0]
let toFirstGameSync = pgn => applySync(toGamesSync(pgn), toFirstGameG)?.[0]

let lexAsync = pgn => applyAsync(flatAsync(pgn), lexG)
let tokeniseAsync = pgn => applyAsync(lexAsync(pgn), tokeniseG)
let parseAsync = pgn => applyAsync(tokeniseAsync(pgn), parseG)
let toGamesAsync = pgn => applyAsync(parseAsync(pgn), toGamesG)
let toGameAsync = pgn => applyAsync(toGamesAsync(pgn), toGameG).first
let toFirstGameAsync = pgn => applyAsync(toGamesAsync(pgn), toFirstGameG).first

let fromPGN = (fromPGNSync, fromPGNAsync) => pgn =>
{
	if (typeof pgn[Symbol.iterator] === "function") return fromPGNSync(pgn)
	if (typeof pgn[Symbol.asyncIterator] === "function") return fromPGNAsync(pgn)
}

export let toGames = fromPGN(toGamesSync, toGamesAsync)
export let toGame = fromPGN(toGameSync, toGameAsync)
export let toFirstGame = fromPGN(toFirstGameSync, toFirstGameAsync)
