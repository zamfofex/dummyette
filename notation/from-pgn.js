/// <reference path="../types/notation/from-pgn.d.ts" />
/// <reference types="../types/notation/from-pgn.d.ts" />

import {standardBoard} from "../chess.js"
import {fromFEN, toSAN} from "../notation.js"
import {LiveController, LiveStream} from "../streams.js"

function * lexG(produce)
{
	let char = yield
	while (true)
	{
		if (char === undefined) break
		
		switch (char)
		{
			case ";":
			{
				let lexeme = char
				while (true)
				{
					char = yield
					if (char === undefined) break
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
					if (char === undefined)
					{
						produce()
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
						if (char === undefined) break
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
					if (char === undefined)
					{
						produce()
						return
					}
					
					let ch = char
					if (ch === "\\") char = yield
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
					if (char === undefined) break
					let cp = char.codePointAt()
					if (cp < 0x30) break
					if (cp > 0x39) break
					lexeme += char
				}
				if (lexeme === "$")
				{
					produce()
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
					if (char === undefined) break
				}
				
				if (lexeme === undefined)
				{
					produce()
					return
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
		if (value === undefined) return
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
		if (token === undefined) return
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
		if (token === undefined)
		{
			if (variations.length !== 0) produce()
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
				produce()
				return
			
			case "[":
			{
				if (variations.length !== 0)
				{
					produce()
					return
				}
				
				let key = yield * skipComment()
				if (key === undefined || key.type !== "symbol" && key.type !== "integer")
				{
					produce()
					return
				}
				
				let value = yield * skipComment()
				if (value === undefined || value.type !== "string")
				{
					produce()
					return
				}
				
				let close = yield * skipComment()
				if (close === undefined || close.type !== "]")
				{
					produce()
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
					if (token === undefined)
					{
						produce()
						return
					}
					if (token.type !== ".") break
				}
				
				if (token.type !== "symbol")
				{
					produce()
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
					if (token === undefined) break
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
						if (token === undefined) break
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
					produce()
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
	
	let delta = {before: board, move, after: move.play(), comments, annotation}
	Object.freeze(delta)
	return delta
}

function * toGamesG(produce)
{
	while (true)
	{
		let node = yield
		if (node === undefined) return
		
		let tags = []
		let info = {}
		let deltas = []
		
		while (node.type === "tag")
		{
			let tag = [...node.value]
			Object.freeze(tag)
			tags.push(tag)
			info[tag[0]] = tag[1]
			node = yield
			if (!node)
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
					// todo
					break
				
				case "move":
					let delta = toDelta(node, board)
					if (!delta)
					{
						produce()
						return
					}
					board = delta.after
					deltas.push(delta)
					break
			}
			
			node = yield
			if (!node)
			{
				produce()
				return
			}
		}
		
		let result = node.value
		
		let game = {tags, info, deltas, result}
		Object.freeze(game)
		Object.freeze(tags)
		Object.freeze(info)
		Object.freeze(deltas)
		
		produce(game)
	}
}

let applySync = (input, f) =>
{
	if (input === undefined) return
	
	let result = []
	let invalid = false
	
	let g = f(value =>
	{
		if (value === undefined) invalid = true
		else result.push(value)
	})
	g.next()
	
	for (let value of input)
	{
		let {done} = g.next(value)
		if (invalid) return
		if (done) return result
	}
	while (true)
	{
		let {done} = g.next()
		if (invalid) return
		if (done) return result
	}
}

let applyAsync = (input, f) =>
{
	let controller = LiveController()
	
	let finished = false
	
	let g = f(value =>
	{
		if (value === undefined || controller.tryPush(value)) finished = true
	})
	g.next()
	
	;(async () =>
	{
		for await (let value of input)
		{
			let {done} = g.next(value)
			if (finished || done) return
		}
		while (true)
		{
			let {done} = g.next()
			if (finished || done) return
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

let lexAsync = pgn => applyAsync(flatAsync(pgn), lexG)
let tokeniseAsync = pgn => applyAsync(lexAsync(pgn), tokeniseG)
let parseAsync = pgn => applyAsync(tokeniseAsync(pgn), parseG)
let toGamesAsync = pgn => applyAsync(parseAsync(pgn), toGamesG)

export let toGames = pgn =>
{
	if (typeof pgn[Symbol.iterator] === "function") return toGamesSync(pgn)
	if (typeof pgn[Symbol.asyncIterator] === "function") return toGamesAsync(pgn)
}
