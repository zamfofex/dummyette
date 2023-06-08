import {standardBoard as baseBoard, Board as BaseBoard, Color} from "./checkless-chess.js"
import {vary as checkedVary, isCheck as isCheck0} from "./checked-chess.js"
import {Board as createBoard} from "../variants.js"

export {colors, types, Color, Type, other} from "./checkless-chess.js"
export {whitePawn, whiteKnight, whiteBishop, whiteRook, whiteQueen, whiteKing} from "./checkless-chess.js"
export {blackPawn, blackKnight, blackBishop, blackRook, blackQueen, blackKing} from "./checkless-chess.js"
export {toName, getFile, getRank} from "./checkless-chess.js"

let is = type => (piece, color) =>
{
	if (piece === undefined) return false
	if (piece === null) return false
	return piece.type === type && piece.color === color
}

let failed = Symbol()

let flip0 = key => board =>
{
	let turn = board.get(key)
	if (turn === "white")
	{
		board.set(key, "black")
		return
	}
	if (turn === "black")
	{
		board.set(key, "white")
		return
	}
	return failed
}

export let vary = (baseBoard, variant, {turnKey = "turn", colors = ["white", "black"], isKing = is("king"), isRook = is("rook"), key = "castling", isCheck = isCheck0, flip = flip0(turnKey)} = {}) =>
{
	colors = colors.slice()
	if (colors.some(color => typeof color !== "string")) return
	if (colors.length !== new Set(colors).size) return
	if (typeof key !== "string") return
	if (typeof turnKey !== "string") return
	if (typeof isCheck !== "function") return
	if (typeof isKing !== "function") return
	if (typeof isRook !== "function") return
	if (typeof flip !== "function") return
	
	let rules = Rules(baseBoard, {isCheck, colors, key, isKing, isRook, turnKey, flip})
	if (!rules) return
	
	return checkedVary(createBoard(variant, rules), variant)
}

let Rules = (baseBoard, options, state = {castling: {}, kings: {}}) =>
{
	if (baseBoard === undefined) return
	
	let mutableBoard = baseBoard.MutableBoard()
	
	let getMoves = () => addMoves(mapMoves(mutableBoard.getMoves(), mutableBoard, options, state), mutableBoard, options, state)
	let getCaptures = () => Object.freeze(mapMoves(mutableBoard.getCaptures(), mutableBoard, options, state))
	
	let at = mutableBoard.at
	let put = mutableBoard.put
	
	let width = mutableBoard.get("width")
	let height = mutableBoard.get("height")
	
	width = Number(width)
	height = Number(height)
	
	if (!Number.isInteger(width)) return
	if (!Number.isInteger(height)) return
	
	if (width <= 0) return
	if (height <= 0) return
	
	for (let color of options.colors)
	{
		for (let y = 0 ; y < height ; y++)
		for (let x = 0 ; x < width ; x++)
		{
			let piece = mutableBoard.at({x, y})
			if (options.isKing(piece, color))
			{
				if (state.kings[color])
				{
					if (state.kings[color].x === x)
					if (state.kings[color].y === y)
						continue
					return
				}
				state.kings[color] = {x, y}
			}
		}
		
		if (!state.kings[color]) return
	}
	
	let get = key =>
	{
		if (key === options.key) return JSON.stringify(state.castling)
		return mutableBoard.get(key)
	}
	
	let set = (key, value) =>
	{
		if (key === options.key)
		{
			let castling0 = JSON.parse(value)
			state.castling = {}
			
			for (let color of options.colors)
			{
				let xs = castling0[color]
				if (!(xs instanceof Array)) xs = []
				
				for (let x of xs)
				{
					x = Number(x)
					if (x < 0) continue
					if (x >= width) continue
					if (!options.isRook(mutableBoard.at({x, y: state.kings[color].y}), color)) continue
					
					if (!state.castling[color])
						state.castling[color] = [x]
					else
						state.castling[color].push(x)
				}
				
				state.castling[color]?.sort()
			}
			
			return
		}
		
		mutableBoard.set(key, value)
	}
	
	let clone = () => Rules(mutableBoard.Board(), options, structuredClone(state))
	
	return {getMoves, getCaptures, at, put, get, set, clone}
}

let mapMoves = (moves, board, {colors}, state) => moves.map(move =>
{
	let changed
	
	let oldKings = state.kings
	let newKings = structuredClone(state.kings)
	
	let oldCastling = state.castling
	let newCastling = structuredClone(state.castling)
	
	for (let color of colors)
	{
		let kingPosition = newKings[color]
		
		if (
			move.from.x === kingPosition.x && move.from.y === kingPosition.y ||
			move.to.x === kingPosition.x && move.to.y === kingPosition.y
		)
		{
			changed = true
			delete newCastling[color]
			newKings[color] = {x: move.to.x, y: move.to.y}
		}
		
		if (!newCastling[color]) continue
		
		let changed0
		for (let [i, x] of newCastling[color].entries())
		{
			if (
				move.from.x === x && move.from.y === kingPosition.y ||
				move.to.x === x && move.to.y === kingPosition.y
			)
			{
				changed0 = true
				newCastling[color][i] = undefined
			}
		}
		
		if (changed0)
		{
			changed = true
			newCastling[color] = newCastling[color].filter(c => c !== undefined)
			if (newCastling[color].length === 0) delete newCastling[color]
		}
	}
	
	if (!changed) return move
	
	let play = () =>
	{
		move.play()
		state.castling = newCastling
		state.kings = newKings
	}
	
	let unplay = () =>
	{
		move.unplay()
		state.castling = oldCastling
		state.kings = oldKings
	}
	
	let result = {...move, play, unplay}
	Object.freeze(result)
	return result
})

let addMoves = (moves, board, {colors, turnKey, isCheck, flip}, state) =>
{
	let turn = board.get(turnKey)
	
	let from = state.kings[turn]
	let king = board.at(from)
	board.put(from, undefined)
	
	let {x: x0, y} = from
	
	for (let rx0 of state.castling[turn] ?? [])
	{
		let x1
		let rx1
		
		if (rx0 < x0) x1 = 2, rx1 = 3
		else x1 = 6, rx1 = 5
		
		let dx = x0 < x1 ? 1 : -1
		
		let rdx = rx0 < rx1 ? 1 : -1
		
		let rookFrom = {x: rx0, y}
		let rook = board.at(rookFrom)
		board.put(rookFrom, undefined)
		
		let cancel
		
		for (let x = x0 ; x !== x1 ; x += dx)
		{
			let position = {x, y}
			if (board.at(position) !== undefined)
			{
				cancel = true
				break
			}
			board.put(position, king)
			let check = isCheck(board)
			board.put(position, undefined)
			if (check)
			{
				cancel = true
				break
			}
		}
		
		if (!cancel)
		{
			for (let x = rx0 ; x !== rx1 ; x += rdx)
			{
				let position = {x, y}
				if (board.at(position) !== undefined)
				{
					cancel = true
					break
				}
			}
		}
		
		board.put(rookFrom, rook)
		if (cancel) continue
		
		let to = {x: x1, y}
		let rookTo = {x: rx1, y}
		
		if (x0 !== x1 && board.at(to) !== undefined) continue
		if (rx0 !== rx1 && board.at(rookTo) !== undefined) continue
		
		let oldCastling = state.castling
		let newCastling = structuredClone(state.castling)
		
		delete newCastling[turn]
		
		let oldKings = state.kings
		let newKings = structuredClone(state.kings)
		
		newKings[turn] = to
		
		let play = () =>
		{
			board.put(from, undefined)
			board.put(to, king)
			
			board.put(rookFrom, undefined)
			board.put(rookTo, rook)
			
			state.castling = newCastling
			state.kings = newKings
			
			flip(board)
		}
		
		let unplay = () =>
		{
			board.put(from, king)
			board.put(to, undefined)
			
			board.put(rookFrom, rook)
			board.put(rookTo, undefined)
			
			state.castling = oldCastling
			state.kings = oldKings
			
			board.set(turnKey, turn)
		}
		
		let move = {from, to, play, unplay, rook: {from: rookFrom, to: rookTo}}
		
		Object.freeze(move, from, to, move.rook, rookFrom, rookTo)
		moves.push(move)
	}
	
	board.put(from, king)
	
	Object.freeze(moves)
	return moves
}

export let variant = Symbol("chess")
export let standardBoard = vary(baseBoard, variant).set("castling", `{"white": [0, 7], "black": [0, 7]}`)
export let Board = (pieces, {width, height, turn = "white", passing, castling = {white: [0, 7], black: [0, 7]}} = {}) =>
{
	let board = BaseBoard(pieces, {width, height, turn, passing})
	return vary(board, variant)?.set("castling", JSON.stringify(castling))
}
