import {pieces as pieceRandom, castling, enPassant, turn} from "./internal/random.js"
import {Pawn, other, pieces} from "./chess.js"

let offsets =
{
	pawn: 0,
	knight: 2,
	bishop: 4,
	rook: 6,
	queen: 8,
	king: 10,
}

let Hash = board =>
{
	let result = 0n
	
	for (let x = 0 ; x < 8 ; x++)
	for (let y = 0 ; y < 8 ; y++)
	{
		let piece = board.at(x, y)
		if (!piece) continue
		
		let offset = offsets[piece.type]
		if (piece.color === "white") offset++
		
		let pieceOffset = y*8 + x + offset*64
		
		result ^= pieceRandom[pieceOffset]
	}
	
	if (board.get(4, 0) === "initial")
	{
		if (board.get(0, 0) === "initial")
			result ^= castling[1]
		if (board.get(7, 0) === "initial")
			result ^= castling[0]
	}
	if (board.get(4, 7) === "initial")
	{
		if (board.get(0, 7) === "initial")
			result ^= castling[3]
		if (board.get(7, 7) === "initial")
			result ^= castling[2]
	}
	
	let y = board.turn === "white" ? 3 : 4
	let pawn = Pawn(other(board.turn))
	for (let x = 0 ; x < 8 ; x++)
	{
		if (board.get(x, y) === "passing")
		{
			if (board.at(x, y-1) === pawn || board.at(x, y+1) === pawn)
				result ^= enPassant[x]
			break
		}
	}
	
	if (board.turn === "white")
		result ^= turn[0]
	
	return result
}

let promotionNames = ["", "n", "b", "r", "q"]
let files = "abcdefgh"

export let OpeningBook = bytes =>
{
	if (bytes instanceof Uint8Array) bytes = bytes.slice().buffer
	if (!(bytes instanceof DataView)) bytes = new DataView(bytes)
	
	let map = new Map()
	
	for (let i = 0 ; i + 15 < bytes.byteLength ; i += 16)
	{
		let hash = bytes.getBigUint64(i, false)
		let value = bytes.getUint16(i + 8, false)
		let weight = bytes.getUint16(i + 10, false)
		
		if (value === 0) continue
		if (weight === 0) continue
		
		let toFile = (value >>> 3*0) & 0b111
		let toRank = (value >>> 3*1) & 0b111
		let fromFile = (value >>> 3*2) & 0b111
		let fromRank = (value >>> 3*3) & 0b111
		let promotion = (value >>> 3*4) & 0b111
		
		let name =
			files[fromFile] + (fromRank+1) +
			files[toFile] + (toRank+1) +
			promotionNames[promotion]
		
		if (!map.has(hash)) map.set(hash, [])
		let moves = map.get(hash)
		
		let move = {name, weight}
		Object.freeze(move)
		
		moves.push(move)
	}
	
	for (let move of map.values())
		Object.freeze(move)
	
	let none = []
	Object.freeze(none)
	
	let lookup = board =>
	{
		if (board.width !== 8) return
		if (board.height !== 8) return
		
		let hash = Hash(board)
		let moves = map.get(hash)
		if (!moves) return none
		
		let other
		for (let move of moves)
		{
			let name
			
			if (move.name === "e1h1" && board.at(4, 0) === pieces.whiteKing)
				name = "e1g1"
			if (move.name === "e1a1" && board.at(4, 0) === pieces.whiteKing)
				name = "e1c1"
			
			if (move.name === "e8h8" && board.at(4, 7) === pieces.blackKing)
				name = "e8g8"
			if (move.name === "e8a8" && board.at(4, 7) === pieces.blackKing)
				name = "e8c8"
			
			if (!name) continue
			
			move = {name, weight: move.weight}
			Object.freeze(move)
			
			if (!other) other = []
			other.push(move)
		}
		
		if (other)
		{
			Object.freeze(other)
			map.set(hash, other)
			return other
		}
		
		return moves
	}
	
	let result = {lookup}
	Object.freeze(result)
	
	return result
}
