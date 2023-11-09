/// <reference path="./types/chess.d.ts" />
/// <reference types="./types/chess.d.ts" />

import {Board as createBoard, Position} from "./internal/variants.js"
export {Position, sameBoard} from "./internal/variants.js"

export let values = {pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9}
Object.freeze(values)

export let other = color =>
{
	if (color === "white")
		return "black"
	else if (color === "black")
		return "white"
}

export let types = ["pawn", "knight", "bishop", "rook", "queen", "king"]
export let colors = ["white", "black"]
Object.freeze(types)
Object.freeze(colors)

export let pieceList = []
export let pieceNames = []
export let pieces = {}

for (let color of colors)
for (let type of types)
{
	let name = `${color} ${type}`
	let piece = {color, type, name}
	Object.freeze(piece)
	
	let titleName = color + type[0].toUpperCase() + type.slice(1)
	pieceList.push(piece)
	pieceNames.push(name)
	pieces[name] = piece
	pieces[titleName] = piece
}

Object.freeze(pieceList)
Object.freeze(pieceNames)
Object.freeze(pieces)

export let getPieceName = piece =>
{
	piece = Piece(piece)
	if (!piece) return
	return piece.name
}

export let Piece = ({color, type}) =>
{
	let name = `${color} ${type}`
	return pieces[name]
}

export let Pawn = color => Piece({type: "pawn", color})
export let Knight = color => Piece({type: "knight", color})
export let Bishop = color => Piece({type: "bishop", color})
export let Rook = color => Piece({type: "rook", color})
export let Queen = color => Piece({type: "queen", color})
export let King = color => Piece({type: "king", color})

export let WhitePiece = type => Piece({type, color: "white"})
export let BlackPiece = type => Piece({type, color: "black"})

export let Color = color =>
{
	color = String(color)
	if (!colors.includes(color)) return
	return color
}

export let Type = type =>
{
	type = String(type)
	if (!type.includes(type)) return
	return type
}

export let variant = Symbol("chess")

let check = board =>
{
	let king = King(board.turn)
	let {x, y} = board.positions.find(position => board.at(position) === king)
	return attacked(board, x, y, board.turn)
}

let checkmate = board => board.check && board.moves.length === 0
let stalemate = board => !board.check && board.moves.length === 0

let validate = board =>
{
	let whitePositions = board.positions.filter(position => board.at(position) === pieces.whiteKing)
	let blackPositions = board.positions.filter(position => board.at(position) === pieces.blackKing)
	
	if (whitePositions.length !== 1) return
	if (blackPositions.length !== 1) return
	
	let color = other(board.turn)
	let position = color === "white" ? whitePositions[0] : blackPositions[0]
	return !attacked(board, position.x, position.y, color)
}

export let Board = (storage, {turn = "white", width = 8, height = 8, castling, passing} = {}) =>
{
	let info = {check, checkmate, stalemate, draw: stalemate}
	return createBoard({variant, width, height, turn, Piece, getMoves: board => getMoves(board), storage, info, validate, castling, passing})
}

export let Board960 = (n = Math.floor(Math.random() * 960)) =>
{
	n = Number(n)
	if (!Number.isInteger(n)) return
	if (n < 0) return
	if (n >= 960) return
	
	let storage = Array(64).fill()
	let available = Array(8).fill().map((n, i) => i)
	
	let next = m =>
	{
		let result = n % m
		n = Math.floor(n / m)
		return result
	}
	
	let place = (type, x) =>
	{
		let white = WhitePiece(type)
		let black = BlackPiece(type)
		
		storage[x + 0] = white
		storage[x + 8] = pieces.whitePawn
		
		storage[x + 56] = black
		storage[x + 48] = pieces.blackPawn
		
		available.splice(available.indexOf(x), 1)
	}
	
	place("bishop", next(4) * 2 + 1)
	place("bishop", next(4) * 2)
	
	place("queen", available[next(6)])
	
	if (n < 4)
	{
		place("knight", available[0])
		place("knight", available[n])
	}
	else if (n < 7)
	{
		place("knight", available[1])
		place("knight", available[n - 3])
	}
	else if (n < 9)
	{
		place("knight", available[2])
		place("knight", available[n - 5])
	}
	else
	{
		place("knight", available[3])
		place("knight", available[3])
	}
	
	let castling =
	{
		white: [{x: available[0], y: 0}, {x: available[2], y: 0}],
		black: [{x: available[0], y: 7}, {x: available[2], y: 7}],
	}
	
	place("rook", available[0])
	place("king", available[0])
	place("rook", available[0])
	
	return Board(storage, {castling})
}

let find = (board, piece, x, y, dx, dy) =>
{
	while (true)
	{
		x += dx
		y += dy
		if (!board.contains(x, y)) return
		let other = board.at(x, y)
		if (other === piece) return [x, y]
		if (other) return
	}
}

let attacked = (board, x, y, color) =>
{
	let opponent = other(color)
	
	let rook = Rook(opponent)
	let queen = Queen(opponent)
	let bishop = Bishop(opponent)
	let knight = Knight(opponent)
	let pawn = Pawn(opponent)
	let king = King(opponent)
	
	for (let [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]])
	{
		let rookPosition = find(board, rook, x, y, dx, dy)
		if (rookPosition) return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition) return true
	}
	for (let [dx, dy] of [[-1, 1], [1, -1], [1, 1], [-1, -1]])
	{
		let bishopPosition = find(board, bishop, x, y, dx, dy)
		if (bishopPosition) return true
		
		let queenPosition = find(board, queen, x, y, dx, dy)
		if (queenPosition) return true
	}
	
	for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
		if (board.at(x + dx, y + dy) === knight)
			return true
	
	let dy = opponent === "white" ? -1 : 1
	for (let dx of [-1, 1])
		if (board.at(x + dx, y + dy) === pawn)
			return true
	
	for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
		if (board.at(x + dx, y + dy) === king)
			return true
	
	return false
}

export let standardBoard = Board960(518)

let shortNames = {knight: "n", bishop: "b", rook: "r", queen: "q", king: "k"}

let createMoves = (board, moves, x, y, x1, y1, rook, capturedPosition) =>
{
	if (!board.contains(x1, y1)) return
	
	let piece = board.at(x, y)
	
	if (!capturedPosition) capturedPosition = Position(x1, y1)
	let capturedPiece = board.at(capturedPosition)
	let captured
	
	if (rook)
	{
		rook.piece = board.at(rook.from)
		Object.freeze(rook)
	}
	else if (capturedPiece)
	{
		captured = {piece: capturedPiece, position: capturedPosition}
		Object.freeze(captured)
	}
	
	let passing
	
	let replacements = [piece]
	if (piece.type === "pawn")
	{
		if (piece.color === "white" && y1 === board.height - 1 || piece.color === "black" && y1 === 0)
		{
			replacements = [Queen, Rook, Bishop, Knight].map(f => f(piece.color))
		}
		if (Math.abs(y1 - y) === 2)
		{
			let pawn = Pawn(other(piece.color))
			if (board.at(x1 - 1, y1) === pawn || board.at(x1 + 1, y1) === pawn)
				passing = Position(x1, y1)
		}
	}
	
	let index = position => position.x + position.y * board.width
	
	let castling = {...board.castling}
	for (let replacement of replacements)
	{
		let storage = board.storage.slice()
		
		if (rook) storage[index(rook.from)] = undefined
		
		let from = Position(x, y)
		let to = Position(x1, y1)
		let turn = other(board.turn)
		
		if (piece.type === "king")
			castling[piece.color] = []
		
		if (piece.type === "rook")
			castling[piece.color] = castling[piece.color].filter(position => position.name !== from.name)
		
		castling[turn] = castling[turn].filter(position => position.name !== to.name)
		
		storage[index(capturedPosition)] = undefined
		storage[index(from)] = undefined
		storage[index(to)] = replacement
		
		let play = () => Board(storage, {width: board.width, height: board.height, turn: other(board.turn), castling, passing})
		
		let name = from.name + to.name
		let move = {play, name, from, to, piece, before: board}
		
		if (replacements.length > 1)
			move.name += shortNames[replacement.type],
			move.promotion = replacement
		
		if (captured) move.captured = captured
		
		if (rook)
		{
			storage[index(rook.to)] = rook.piece
			
			move.name = from.name + rook.from.name
			move.rook = rook
			
			x1 = rook.to.x + Math.sign(move.to.x - move.from.x)
			move.to = Position(x1, y1)
			
			if (attacked(board, x, y1, piece.color)) return
			
			let dx = Math.sign(move.to.x - move.from.x)
			
			if (Position(x1, y1).name !== rook.from.name && board.at(x1, y1)) return
			
			for (let x0 = x + dx ; x0 !== x1 ; x0 += dx)
			{
				if (attacked(board, x0, y1, piece.color)) return
				if (Position(x0, y1).name !== rook.from.name && board.at(x0, y1)) return
			}
			
			let rdx = Math.sign(rook.to.x - rook.from.x)
			for (let x1 = rook.from.x + rdx ; x1 !== rook.to.x ; x1 += rdx)
			{
				let other = board.at(x1, y1)
				if (other && other !== piece) continue
			}
			
			if (rook.from.x !== rook.to.x)
			{
				let other = board.at(rook.to.x, y1)
				if (other && other !== piece) return
			}
			
			if (board.width === 8)
			if (rook.from.x === 0 || rook.from.x === board.width - 1)
			if (x === 4)
				move.name = from.name + to.name
		}
		
		Object.freeze(move)
		moves.push(move)
	}
}

let createLineMoves = (board, moves, x, y, dx, dy) =>
{
	let x1 = x
	let y1 = y
	let color = board.at(x, y).color
	while (true)
	{
		x1 += dx
		y1 += dy
		if (!board.contains(x1, y1)) break
		let piece = board.at(x1, y1)
		if (color !== piece?.color)
			createMoves(board, moves, x, y, x1, y1)
		if (piece) break
	}
}

let getMoves = board =>
{
	let moves = []
	
	for (let y = 0 ; y < board.height ; y++)
	for (let x = 0 ; x < board.width ; x++)
	{
		let piece = board.at(x, y)
		if (!piece) continue
		if (piece.color !== board.turn) continue
		switch (piece.type)
		{
			case "pawn":
			{
				let dy = piece.color === "white" ? 1 : -1
				let y1 = y + dy
				for (let dx of [1, -1])
				{
					let x1 = x + dx
					let piece2 = board.at(x1, y1)
					if (piece2 && piece.color !== piece2.color)
						createMoves(board, moves, x, y, x1, y1)
				}
				if (y <= 1 || y >= board.height - 2)
				if (!board.at(x, y1) && !board.at(x, y1 + dy))
					createMoves(board, moves, x, y, x, y1 + dy)
				
				if (!board.at(x, y1))
					createMoves(board, moves, x, y, x, y1)
				
				let a = board.Position(x - 1, y)
				let b = board.Position(x + 1, y)
				let passing = Pawn(other(piece.color))
				if (board.at(a) === passing && board.passing?.name === a.name)
					createMoves(board, moves, x, y, x - 1, y1, null, a)
				if (board.at(b) === passing && board.passing?.name === b.name)
					createMoves(board, moves, x, y, x + 1, y1, null, b)
				
				break
			}
			case "rook":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "bishop":
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "knight":
				for (let [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color !== board.at(x1, y1)?.color)
						createMoves(board, moves, x, y, x1, y1)
				}
				break
			case "queen":
				for (let [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]])
					createLineMoves(board, moves, x, y, dx, dy)
				break
			case "king":
			{
				for (let [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]])
				{
					let x1 = x + dx
					let y1 = y + dy
					if (piece.color === board.at(x1, y1)?.color) continue
					createMoves(board, moves, x, y, x1, y1)
				}
				
				if (board.check) break
				
				let rook = Rook(piece.color)
				
				for (let position of board.castling[piece.color])
				{
					let kx = position.x < x ? 2 : board.width - 2
					let rx = position.x < x ? 3 : board.width - 3
					createMoves(board, moves, x, y, kx, y, {from: Position(position.x, y), to: Position(rx, y)})
				}
				
				break
			}
		}
	}
	
	moves = moves.filter(move => move.play())
	Object.freeze(moves)
	return moves
}
