/// <reference path="./types/fast-chess.d.ts" />
/// <reference types="./types/fast-chess.d.ts" />

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

let values = [1, 3, 3, 5, 9, 0]

let colors = {white: White, black: Black}
let types = {pawn: Pawn, knight: Knight, bishop: Bishop, rook: Rook, queen: Queen, king: King}

let QueenSideCastle = 1
let KingSideCastle = 2

let createBoard = (state, array) =>
{
	let result =
	{
		getScore: () => getScore(array),
		getMoves: () => getValidMoves(state, array),
		isCheck: () => isCheck(state, array, state.turn),
		toJSON: () =>
		{
			let state2 = {...state}
			let array2 = [...array]
			
			state2.whiteKingPosition = {x: state.whiteKingPosition.x, y: state.whiteKingPosition.y}
			state2.blackKingPosition = {x: state.blackKingPosition.x, y: state.blackKingPosition.y}
			
			let json = {state: state2, array: array2}
			Object.freeze(json, state2, array2)
			
			return json
		},
	}
	
	Object.freeze(result)
	return result
}

export let MutableBoard = board =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let array = new Uint8Array(64)
	
	for (let x = 0 ; x < 8 ; x++)
	for (let y = 0 ; y < 8 ; y++)
	{
		let piece = board.at(x, y)
		if (piece === null) continue
		let {color, type} = piece
		array[x + y * 8] = colors[color] | types[type]
	}
	
	let whiteCastling = 0
	if (board.get(4, 0) === "initial")
	{
		if (board.get(0, 0) === "initial") whiteCastling |= QueenSideCastle
		if (board.get(7, 0) === "initial") whiteCastling |= KingSideCastle
	}
	let blackCastling = 0
	if (board.get(4, 7) === "initial")
	{
		if (board.get(0, 7) === "initial") blackCastling |= QueenSideCastle
		if (board.get(7, 7) === "initial") blackCastling |= KingSideCastle
	}
	
	let state =
	{
		whiteKingPosition: board.getKingPosition("white"),
		blackKingPosition: board.getKingPosition("black"),
		turn: board.turn === "white" ? White : Black,
		whiteCastling, blackCastling,
	}
	
	return createBoard(state, array)
}

export let fromJSON = ({state, array}) =>
{
	state = {...state}
	array = new Uint8Array(array)
	return createBoard(state, array)
}

let getScore = array =>
{
	let score = 0
	for (let i = 0 ; i < 64 ; i++)
	{
		let piece = array[i]
		let j = (piece >>> 4) - 1
		if ((piece & Color) === White) score += values[j]
		if ((piece & Color) === Black) score -= values[j]
	}
	return score
}

let isCheck = (state, array, color) =>
{
	let other = color === White ? Black : White
	let {x, y} = color === White ? state.whiteKingPosition : state.blackKingPosition
	
	let rook = Rook | other
	let queen = Queen | other
	let bishop = Bishop | other
	let knight = Knight | other
	let pawn = Pawn | other
	let king = King | other
	
	// rook and queen
	
	for (let x1 = x + 1 ; x1 < 8 ; x1++)
	{
		let piece = array[x1 + y * 8]
		if (piece === rook) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let x1 = x - 1 ; x1 >= 0 ; x1--)
	{
		let piece = array[x1 + y * 8]
		if (piece === rook) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let y1 = y + 1 ; y1 < 8 ; y1++)
	{
		let piece = array[x + y1 * 8]
		if (piece === rook) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let y1 = y - 1 ; y1 >= 0 ; y1--)
	{
		let piece = array[x + y1 * 8]
		if (piece === rook) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	
	// bishop and queen
	
	for (let i = 1 ; true ; i++)
	{
		if (x + i > 7) break
		if (y + i > 7) break
		let piece = array[(x + i) + (y + i) * 8]
		if (piece === bishop) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let i = 1 ; true ; i++)
	{
		if (x + i > 7) break
		if (y - i < 0) break
		let piece = array[(x + i) + (y - i) * 8]
		if (piece === bishop) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let i = 1 ; true ; i++)
	{
		if (x - i < 0) break
		if (y + i > 7) break
		let piece = array[(x - i) + (y + i) * 8]
		if (piece === bishop) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	for (let i = 1 ; true ; i++)
	{
		if (x - i < 0) break
		if (y - i < 0) break
		let piece = array[(x - i) + (y - i) * 8]
		if (piece === bishop) return true
		if (piece === queen) return true
		if (piece !== None) break
	}
	
	// knight
	
	for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
	{
		let x1 = x + dx
		let y1 = y + dy
		
		if (x1 < 0) continue
		if (y1 < 0) continue
		
		if (x1 > 7) continue
		if (y1 > 7) continue
		
		let piece = array[x1 + y1 * 8]
		if (piece === knight) return true
	}
	
	// pawn
	
	let dy = other === White ? -1 : 1
	if (x < 7 && array[(x + 1) + (y + dy) * 8] === pawn)
		return true
	if (x > 0 && array[(x - 1) + (y + dy) * 8] === pawn)
		return true
	
	// king
	
	if (y > 0 && array[(x + 0) + (y - 1) * 8] === king)
		return true
	if (y < 7 && array[(x + 0) + (y + 1) * 8] === king)
		return true
	
	if (x > 0)
	{
		if (array[(x - 1) + (y + 0) * 8] === king)
			return true
		if (y > 0 && array[(x - 1) + (y - 1) * 8] === king)
			return true
		if (y < 7 && array[(x - 1) + (y + 1) * 8] === king)
			return true
	}
	
	if (x < 7)
	{
		if (array[(x + 1) + (y + 0) * 8] === king)
			return true
		if (y > 0 && array[(x + 1) + (y - 1) * 8] === king)
			return true
		if (y < 7 && array[(x + 1) + (y + 1) * 8] === king)
			return true
	}
	
	return false
}

let createMove = (moves, state, array, x, y, x1, y1) =>
{
	let from = x + y * 8
	let to = x1 + y1 * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	let turn = state.turn
	let other = turn === White ? Black : White
	
	let castlingName = turn === White ? "whiteCastling" : "blackCastling"
	let castling = state[castlingName]
	let newCastling = castling
	
	let first = turn === White ? 0 : 7
	
	if (y === first)
	{
		if (x === 0) newCastling &= KingSideCastle
		if (x === 7) newCastling &= QueenSideCastle
	}
	
	let play = () =>
	{
		array[from] = None
		array[to] = beforeFrom
		state.turn = other
		state[castlingName] = newCastling
	}
	
	let unplay = () =>
	{
		array[from] = beforeFrom
		array[to] = beforeTo
		state.turn = turn
		state[castlingName] = castling
	}
	
	play()
	let check = isCheck(state, array, turn)
	unplay()
	if (check) return
	
	let move = {play, unplay}
	Object.freeze(move)
	
	moves.push(move)
}

let createPromotionMoves = (moves, state, array, x, y, x1, y1) =>
{
	let from = x + y * 8
	let to = x1 + y1 * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	let turn = state.turn
	let other = turn === White ? Black : White
	
	for (let type of [Queen, Rook, Bishop, Knight])
	{
		let piece = type | beforeFrom & Color
		
		let play = () =>
		{
			array[from] = None
			array[to] = piece
			state.turn = other
		}
		
		let unplay = () =>
		{
			array[from] = beforeFrom
			array[to] = beforeTo
			state.turn = turn
		}
		
		play()
		let check = isCheck(state, array, turn)
		unplay()
		if (check) continue
		
		let move = {play, unplay}
		Object.freeze(move)
		
		moves.push(move)
	}
}

let createKingMove = (moves, state, array, x, y, x1, y1) =>
{
	let from = x + y * 8
	let to = x1 + y1 * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	let turn = state.turn
	let other = turn === White ? Black : White
	
	let positionName = turn === White ? "whiteKingPosition" : "blackKingPosition"
	let position = state[positionName]
	let newPosition = {x: x1, y: y1}
	
	let castlingName = turn === White ? "whiteCastling" : "blackCastling"
	let castling = state[castlingName]
	
	let play = () =>
	{
		array[from] = None
		array[to] = beforeFrom
		state.turn = other
		state[positionName] = newPosition
		state[castlingName] = 0
	}
	
	let unplay = () =>
	{
		array[from] = beforeFrom
		array[to] = beforeTo
		state.turn = turn
		state[positionName] = position
		state[castlingName] = castling
	}
	
	play()
	let check = isCheck(state, array, turn)
	unplay()
	if (check) return
	
	let move = {play, unplay}
	Object.freeze(move)
	
	moves.push(move)
}

let createCastling = (moves, state, array, x, y, rookX, dx) =>
{
	let x1 = x + dx + dx
	let from = x + y * 8
	let to = x1 + y * 8
	
	let rookIndex = rookX + y * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	let rook = array[rookIndex]
	
	let turn = state.turn
	let other = turn === White ? Black : White
	
	let positionName = turn === White ? "whiteKingPosition" : "blackKingPosition"
	let position = state[positionName]
	let newPosition = {x: x1, y}
	
	let castlingName = turn === White ? "whiteCastling" : "blackCastling"
	let castling = state[castlingName]
	
	let play = () =>
	{
		array[from] = None
		array[to] = beforeFrom
		array[rookIndex] = None
		array[x + dx] = rook
		state.turn = other
		state[positionName] = newPosition
		state[castlingName] = 0
	}
	
	let unplay = () =>
	{
		array[from] = beforeFrom
		array[to] = beforeTo
		array[rookIndex] = rook
		array[x + dx] = None
		state.turn = turn
		state[positionName] = position
		state[castlingName] = castling
	}
	
	let check = isCheck(state, array, turn)
	
	if (!check)
	{
		play()
		check = isCheck(state, array, turn)
		if (!check)
		{
			state[positionName] = {x: x + dx, y}
			check = isCheck(state, array, turn)
		}
		unplay()
	}
	
	if (check) return
	
	let move = {play, unplay}
	Object.freeze(move)
	
	moves.push(move)
}

let getValidMoves = (state, array) =>
{
	let moves = []
	
	let {turn} = state
	
	for (let x = 0 ; x < 8 ; x++)
	for (let y = 0 ; y < 8 ; y++)
	{
		let piece = array[x + y * 8]
		let color = piece & Color
		let type = piece & Type
		
		if (color !== turn) continue
		
		switch (type)
		{
			case Pawn:
			{
				let first = color === White ? 1 : 6
				let last = color === White ? 7 : 0
				
				let dy = color === White ? 1 : -1
				let y1 = y + dy
				
				let createPawnMoves = createMove
				if (y1 === last) createPawnMoves = createPromotionMoves
				
				if (array[x + y1 * 8] === None)
				{
					createPawnMoves(moves, state, array, x, y, x, y1)
					let y2 = y1 + dy
					if (y === first)
					if (array[x + y2 * 8] === None)
						createMove(moves, state, array, x, y, x, y2)
				}
				
				let right = array[x + 1 + y1 * 8] & Color
				if (x < 7 && right !== turn && right !== None)
					createPawnMoves(moves, state, array, x, y, x + 1, y1)
				
				let left = array[x - 1 + y1 * 8] & Color
				if (x > 0 && left !== turn && left !== None)
					createPawnMoves(moves, state, array, x, y, x - 1, y1)
				
				break
			}
			
			case Knight:
				for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
				{
					let x1 = x + dx
					let y1 = y + dy
					
					if (x1 < 0) continue
					if (y1 < 0) continue
					
					if (x1 > 7) continue
					if (y1 > 7) continue
					
					let other = array[x1 + y1 * 8] & Color
					if (other !== color) createMove(moves, state, array, x, y, x1, y1)
				}
				break
			
			case Bishop:
			case Rook:
			case Queen:
				if (type !== Bishop)
				{
					for (let x1 = x + 1 ; x1 < 8 ; x1++)
					{
						let other = array[x1 + y * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x1, y)
						if (other !== None) break
					}
					for (let x1 = x - 1 ; x1 >= 0 ; x1--)
					{
						let other = array[x1 + y * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x1, y)
						if (other !== None) break
					}
					
					for (let y1 = y + 1 ; y1 < 8 ; y1++)
					{
						let other = array[x + y1 * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x, y1)
						if (other !== None) break
					}
					for (let y1 = y - 1 ; y1 >= 0 ; y1--)
					{
						let other = array[x + y1 * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x, y1)
						if (other !== None) break
					}
				}
				
				if (type !== Rook)
				{
					for (let i = 1 ; true ; i++)
					{
						if (x + i > 7) break
						if (y + i > 7) break
						let other = array[(x + i) + (y + i) * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x + i, y + i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x + i > 7) break
						if (y - i < 0) break
						let other = array[(x + i) + (y - i) * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x + i, y - i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x - i < 0) break
						if (y + i > 7) break
						let other = array[(x - i) + (y + i) * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x - i, y + i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x - i < 0) break
						if (y - i < 0) break
						let other = array[(x - i) + (y - i) * 8] & Color
						if (other !== color) createMove(moves, state, array, x, y, x - i, y - i)
						if (other !== None) break
					}
				}
				
				break
			
			case King:
			{
				let castling = color === White ? state.whiteCastling : state.blackCastling
				
				if (castling & QueenSideCastle)
				if (array[3 + y * 8] === None)
				if (array[2 + y * 8] === None)
				if (array[1 + y * 8] === None)
					createCastling(moves, state, array, x, y, 0, -1)
				
				if (castling & KingSideCastle)
				if (array[5 + y * 8] === None)
				if (array[6 + y * 8] === None)
					createCastling(moves, state, array, x, y, 7, 1)
				
				if (y > 0 && (array[(x + 0) + (y - 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x + 0, y - 1)
				if (y < 7 && (array[(x + 0) + (y + 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x + 0, y + 1)
				
				if (x > 0)
				{
					if ((array[(x - 1) + (y + 0) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x - 1, y + 0)
					if (y > 0 && (array[(x - 1) + (y - 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x - 1, y - 1)
					if (y < 7 && (array[(x - 1) + (y + 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x - 1, y + 1)
				}
				
				if (x < 7)
				{
					if ((array[(x + 1) + (y + 0) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x + 1, y + 0)
					if (y > 0 && (array[(x + 1) + (y - 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x + 1, y - 1)
					if (y < 7 && (array[(x + 1) + (y + 1) * 8] & Color) !== color) createKingMove(moves, state, array, x, y, x + 1, y + 1)
				}
				
				break
			}
		}
	}
	
	Object.freeze(moves)
	return moves
}
