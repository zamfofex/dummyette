import {Board as createBoard} from "../variants.js"

export let colors = ["white", "black"]
export let types = ["pawn", "knight", "bishop", "rook", "queen", "king"]

Object.freeze(colors)
Object.freeze(types)

let toColor = color =>
{
	color = String(color)
	if (!colors.includes(color)) return
	return color
}

let toType = type =>
{
	type = String(type)
	if (!types.includes(type)) return
	return type
}

export {toColor as Color, toType as Type}

export let other = color =>
{
	if (color === "white") return "black"
	if (color === "black") return "white"
}

let P = (color, type) => Object.freeze({color, type, name: `${color} ${type}`})

export let whitePawn = P("white", "pawn")
export let whiteKnight = P("white", "knight")
export let whiteBishop = P("white", "bishop")
export let whiteRook = P("white", "rook")
export let whiteQueen = P("white", "queen")
export let whiteKing = P("white", "king")

export let blackPawn = P("black", "pawn")
export let blackKnight = P("black", "knight")
export let blackBishop = P("black", "bishop")
export let blackRook = P("black", "rook")
export let blackQueen = P("black", "queen")
export let blackKing = P("black", "king")

let Color = 0x0F
let Type = 0xF0

let None = 0

let White = 0x1
let Black = 0x2

let Pawn = 0x10
let Knight = 0x20
let Bishop = 0x30
let Rook = 0x40
let Queen = 0x50
let King = 0x60

let Dummy = 0xF0

let block = {type: "block", name: "block"}
let whiteDummy = {color: "white", type: "dummy", name: "white dummy"}
let blackDummy = {color: "black", type: "dummy", name: "black dummy"}
let dummy = {type: "dummy", name: "dummy"}

let colorMap = new Map([["white", White], ["black", Black]])
let typeMap = new Map([["dummy", Dummy], ["pawn", Pawn], ["knight", Knight], ["bishop", Bishop], ["rook", Rook], ["queen", Queen], ["king", King]])
let pieceMap = new Map(
[
	[White|Pawn, whitePawn],
	[White|Knight, whiteKnight],
	[White|Bishop, whiteBishop],
	[White|Rook, whiteRook],
	[White|Queen, whiteQueen],
	[White|King, whiteKing],
	
	[Black|Pawn, blackPawn],
	[Black|Knight, blackKnight],
	[Black|Bishop, blackBishop],
	[Black|Rook, blackRook],
	[Black|Queen, blackQueen],
	[Black|King, blackKing],
	
	[White|Dummy, whiteDummy],
	[Black|Dummy, blackDummy],
	[White|Black|Dummy, block],
	[Dummy, dummy],
])

let Rules = (width, height, storage, state) => (
{
	getMoves: () => getMoveArray(width, height, storage, state, true),
	getCaptures: () => getMoveArray(width, height, storage, state, true, true),
	getMoveFunctions: () => getMoveArray(width, height, storage, state),
	getCaptureFunctions: () => getMoveArray(width, height, storage, state, false, true),
	at: position =>
	{
		if (typeof position !== "object") return
		if (position === null) return
		
		let {x, y} = position
		
		x = Number(x)
		y = Number(y)
		
		if (!Number.isInteger(x)) return
		if (!Number.isInteger(y)) return
		
		if (x < 0) return
		if (y < 0) return
		
		if (x >= width) return
		if (y >= height) return
		
		return pieceMap.get(storage[x + y * width])
	},
	put: (position, piece) =>
	{
		if (typeof position !== "object") return
		if (position === null) return
		
		let {x, y} = position
		
		x = Number(x)
		y = Number(y)
		
		if (!Number.isInteger(x)) return
		if (!Number.isInteger(y)) return
		
		if (x < 0) return
		if (y < 0) return
		
		if (x >= width) return
		if (y >= height) return
		
		if (piece === undefined)
		{
			storage[x + y * width] = None
			return
		}
		
		let pieceType = String(piece.type)
		let pieceColor = piece.color
		
		if (pieceType === "block")
		{
			storage[x + y * width] = White|Black|Dummy
			return
		}
		
		if (pieceType === "dummy" && pieceColor === undefined)
		{
			storage[x + y * width] = Dummy
			return
		}
		
		let color = colorMap.get(String(pieceColor))
		let type = typeMap.get(pieceType)
		if (!color) return
		if (!type) return
		
		storage[x + y * width] = color | type
	},
	get: key =>
	{
		if (key === "width") return width
		if (key === "height") return height
		
		let value = state.get(key)
		if (key === "turn")
		{
			if (value === White) return "white"
			return "black"
		}
		
		return value
	},
	set: (key, value) =>
	{
		switch (key)
		{
			default:
				return
			case "passing":
				value = Number(value)
				if (!Number.isInteger(value)) return
				if (value < 0) return
				if (value >= width) return
				break
			case "turn":
				if (value === "white") value = White
				else if (value === "black") value = Black
				else return
				break
		}
		state.set(key, value)
	},
	clone: () => Rules(width, height, storage.slice(), new Map(state)),
})

let storage =
[
	White|Rook, White|Knight, White|Bishop, White|Queen, White|King, White|Bishop, White|Knight, White|Rook,
	...Array(8).fill(White|Pawn), ...Array(32).fill(None), ...Array(8).fill(Black|Pawn),
	Black|Rook, Black|Knight, Black|Bishop, Black|Queen, Black|King, Black|Bishop, Black|Knight, Black|Rook,
]

let state = new Map([["turn", White], ["passing", undefined]])

export let variant = Symbol("checkless chess")

export let standardBoard = createBoard(variant, Rules(8, 8, storage, new Map(state)))

export let EmptyBoard = (width = 8, height = width) =>
{
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width)) return
	if (!Number.isInteger(height)) return
	if (width <= 0) return
	if (height <= 0) return
	
	return createBoard(variant, Rules(width, height, Array(width * height).fill(None), new Map(state)))
}

export let Board = (pieces, {width, height, turn = "white", passing} = {}) =>
{
	if (!(pieces instanceof Array)) return
	if (!pieces.every(a => a instanceof Array)) return
	
	if (height === undefined) height = pieces.length
	if (width === undefined) width = Math.max(...pieces.map(pieces => pieces.length))
	
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width)) return
	if (!Number.isInteger(height)) return
	
	if (width <= 0) return
	if (height <= 0) return
	
	turn = toColor(turn)
	if (!turn) return
	
	if (passing !== undefined)
	{
		passing = Number(passing)
		if (!Number.isInteger(passing)) return
		if (passing < 0) return
	}
	
	let board = EmptyBoard(width, height)
	board = board.set("turn", turn)
	
	for (let y = 0 ; y < height ; y++)
	for (let x = 0 ; x < width ; x++)
		board = board.put({x, y}, pieces[y]?.[x])
	
	if (passing !== undefined) board = board.set("passing", passing)
	
	return board
}

export let getFile = position =>
{
	let file = ""
	
	let x = position.x + 1
	while (x !== 0)
		file += (x % 26 + 9).toString(36),
		x = Math.floor(x / 26)
	
	return file
}

export let getRank = position => String(position.y + 1)

export let toName = position => getFile(position) + getRank(position)

export let fromName = name =>
{
	name = String(name)
	let match = name.match(/^([a-z]+)([1-9][0-9]*)$/)
	if (!match) return
	let [full, file, rank] = match
	
	let x = 0
	let y = Number(rank)
	
	for (let ch of file)
	{
		x *= 26
		x += parseInt(ch, 36) - 9
	}
	
	x--
	y--
	
	if (x < 0) return
	if (y < 0) return
	
	let position = {x, y}
	Object.freeze(position)
	return position
}

let promotionTypes = [Queen, Rook, Bishop, Knight]

let getMoveArray = (width, height, storage, state, fullMoves, onlyCaptures) =>
{
	let passingBefore = state.get("passing")
	
	let createMove = (x0, y0, x1, y1, passing) =>
	{
		if (x1 < 0) return true
		if (y1 < 0) return true
		if (x1 >= width) return true
		if (y1 >= height) return true
		
		let from = x0 + y0 * width
		let to = x1 + y1 * width
		
		let beforeFrom = storage[from]
		let beforeTo = storage[to]
		
		if (beforeTo & color) return true
		
		let play = () =>
		{
			storage[from] = None
			storage[to] = beforeFrom
			state.set("passing", passing)
			state.set("turn", other)
			return unplay
		}
		
		let unplay = () =>
		{
			storage[from] = beforeFrom
			storage[to] = beforeTo
			state.set("passing", passingBefore)
			state.set("turn", color)
		}
		
		let move = play
		if (fullMoves)
		{
			let from = {x: x0, y: y0}
			let to = {x: x1, y: y1}
			move = {play, unplay, from, to}
			Object.freeze(move, from, to)
		}
		
		if (beforeTo) captures.push(move)
		else moves?.push(move)
		
		if (beforeTo) return true
	}
	
	let createPassingCapture = (x0, y0, x1, y1) =>
	{
		if (x1 < 0) return
		if (y1 < 0) return
		if (x1 >= width) return
		if (y1 >= height) return
		
		let from = x0 + y0 * width
		let to = x1 + y1 * width
		let to2 = x1 + y0 * width
		
		let beforeFrom = storage[from]
		let beforeTo = storage[to2]
		
		let play = () =>
		{
			storage[from] = None
			storage[to] = beforeFrom
			storage[to2] = None
			state.set("passing", undefined)
			state.set("turn", other)
			return unplay
		}
		
		let unplay = () =>
		{
			storage[from] = beforeFrom
			storage[to] = None
			storage[to2] = beforeTo
			state.set("passing", passingBefore)
			state.set("turn", color)
		}
		
		let move = play
		if (fullMoves)
		{
			let from = {x: x0, y: y0}
			let to = {x: x1, y: y1}
			move = {play, unplay, from, to, passing: true}
			Object.freeze(move, from, to)
		}
		
		captures.push(move)
	}
	
	let createPromotionMoves = (x0, y0, x1, y1, passing) =>
	{
		if (x1 < 0) return
		if (y1 < 0) return
		if (x1 >= width) return
		if (y1 >= height) return
		
		let from = x0 + y0 * width
		let to = x1 + y1 * width
		
		let beforeFrom = storage[from]
		let beforeTo = storage[to]
		
		if (beforeTo & color) return
		
		for (let type of promotionTypes)
		{
			let piece = type | beforeFrom & Color
			
			let play = () =>
			{
				storage[from] = None
				storage[to] = piece
				state.set("passing", passing)
				state.set("turn", other)
				return unplay
			}
			
			let unplay = () =>
			{
				storage[from] = beforeFrom
				storage[to] = beforeTo
				state.set("passing", passingBefore)
				state.set("turn", color)
			}
			
			let move = play
			if (fullMoves)
			{
				let from = {x: x0, y: y0}
				let to = {x: x1, y: y1}
				move = {play, unplay, from, to}
				Object.freeze(move, from, to)
			}
			
			captures.push(move)
		}
	}
	
	let color = state.get("turn")
	let other = color === White ? Black : White
	
	let moves = []
	let captures = []
	
	if (onlyCaptures) moves = undefined
	
	for (let y = 0 ; y < height ; y++)
	for (let x = 0 ; x < width ; x++)
	{
		let piece = storage[x + y * width]
		if (!(piece & color)) continue
		let type = piece & Type
		
		switch (type)
		{
			case Pawn:
			{
				let first = color === White ? 1 : height - 2
				let last = color === White ? height - 1 : 0
				let passingY = color === White ? height - 4 : 3
				
				let dy = color === White ? 1 : -1
				let y1 = y + dy
				
				let createPawnMoves = createMove
				if (y1 === last) createPawnMoves = createPromotionMoves
				
				if (y === passingY && passingBefore === x - 1)
					createPassingCapture(x, y, x - 1, y1)
				if (y === passingY && passingBefore === x + 1)
					createPassingCapture(x, y, x + 1, y1)
				
				if (storage[x + y1 * width] === None)
				{
					createPawnMoves(x, y, x, y1)
					let y2 = y1 + dy
					if (y === first && y2 < height)
					if (storage[x + y2 * width] === None)
						createMove(x, y, x, y2, x)
				}
				
				let right = storage[x + 1 + y1 * width]
				if (x < width - 1 && right !== None)
					createPawnMoves(x, y, x + 1, y1)
				
				let left = storage[x - 1 + y1 * width]
				if (x > 0 && left !== None)
					createPawnMoves(x, y, x - 1, y1)
				
				break
			}
			
			case Knight:
				createMove(x, y, x + 1, y + 2)
				createMove(x, y, x + 2, y + 1)
				createMove(x, y, x - 1, y + 2)
				createMove(x, y, x - 2, y + 1)
				createMove(x, y, x + 1, y - 2)
				createMove(x, y, x + 2, y - 1)
				createMove(x, y, x - 1, y - 2)
				createMove(x, y, x - 2, y - 1)
				break
			
			case Bishop:
			case Rook:
			case Queen:
				if (type !== Bishop)
				{
					let x1
					let y1
					
					x1 = x
					do x1++
					while (!createMove(x, y, x1, y))
					
					x1 = x
					do x1--
					while (!createMove(x, y, x1, y))
					
					y1 = y
					do y1++
					while (!createMove(x, y, x, y1))
					
					y1 = y
					do y1--
					while (!createMove(x, y, x, y1))
				}
				
				if (type !== Rook)
				{
					let i
					
					i = 0
					do i++
					while (!createMove(x, y, x + i, y + i))
					
					i = 0
					do i++
					while (!createMove(x, y, x + i, y - i))
					
					i = 0
					do i++
					while (!createMove(x, y, x - i, y + i))
					
					i = 0
					do i++
					while (!createMove(x, y, x - i, y - i))
				}
				
				break
			
			case King:
				createMove(x, y, x + 0, y - 1)
				createMove(x, y, x + 0, y + 1)
				createMove(x, y, x - 1, y + 0)
				createMove(x, y, x - 1, y - 1)
				createMove(x, y, x - 1, y + 1)
				createMove(x, y, x + 1, y + 0)
				createMove(x, y, x + 1, y - 1)
				createMove(x, y, x + 1, y + 1)
				break
		}
	}
	
	let result = captures
	if (!onlyCaptures) result = [...captures, ...moves]
	Object.freeze(result)
	return result
}
