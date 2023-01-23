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

let colors = {white: White, black: Black}
let types = {pawn: Pawn, knight: Knight, bishop: Bishop, rook: Rook, queen: Queen, king: King}

let createBoard = (turn, array) =>
{
	let result =
	{
		getMoves: () => getMoves(turn, array),
		getCaptures: () => getMoves(turn, array, true),
		serialize: () => Object.freeze({turn, array}),
		array, turn,
	}
	
	Object.freeze(result)
	return result
}

export let deserialize = ({turn, array}) => createBoard(turn, array)

export let MutableBoard = board =>
{
	let array = new Uint8Array(64)
	
	for (let x = 0 ; x < 8 ; x++)
	for (let y = 0 ; y < 8 ; y++)
	{
		let piece = board.storage.at(x, y)
		if (!piece) continue
		let {color, type} = piece
		array[x + y * 8] = colors[color] | types[type]
	}
	
	return createBoard([board.state.turn === "white"], array)
}

let createMove = (moves, captures, turn, array, x, y, x1, y1) =>
{
	let from = x + y * 8
	let to = x1 + y1 * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	if (!moves && !beforeTo) return
	
	let play = () =>
	{
		array[from] = None
		array[to] = beforeFrom
		turn[0] = !turn[0]
		return unplay
	}
	
	let unplay = () =>
	{
		array[from] = beforeFrom
		array[to] = beforeTo
		turn[0] = !turn[0]
	}
	
	if (beforeTo) captures.push(play)
	else moves.push(play)
}

let createPromotionMove = (moves, captures, turn, array, x, y, x1, y1) =>
{
	let from = x + y * 8
	let to = x1 + y1 * 8
	
	let beforeFrom = array[from]
	let beforeTo = array[to]
	
	if (!moves && !beforeTo) return
	
	let other = turn[0] ? Black : White
	
	let piece = Queen | beforeFrom & Color
	
	let play = () =>
	{
		array[from] = None
		array[to] = piece
		turn[0] = !turn[0]
		return unplay
	}
	
	let unplay = () =>
	{
		array[from] = beforeFrom
		array[to] = beforeTo
		turn[0] = !turn[0]
	}
	
	captures.push(play)
}

let knightSteps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]

let getMoves = (turn, array, onlyCaptures) =>
{
	let moves = []
	let captures = []
	
	if (onlyCaptures) moves = undefined
	
	for (let y = 0 ; y < 8 ; y++)
	for (let x = 0 ; x < 8 ; x++)
	{
		let piece = array[x + y * 8]
		let color = piece & Color
		let type = piece & Type
		
		if ((color === White) !== turn[0]) continue
		
		switch (type)
		{
			case Pawn:
			{
				let first = color === White ? 1 : 6
				let last = color === White ? 7 : 0
				
				let dy = color === White ? 1 : -1
				let y1 = y + dy
				
				let createPawnMoves = createMove
				if (y1 === last) createPawnMoves = createPromotionMove
				
				if (array[x + y1 * 8] === None)
				{
					createPawnMoves(moves, captures, turn, array, x, y, x, y1)
					let y2 = y1 + dy
					if (y === first)
					if (array[x + y2 * 8] === None)
						createMove(moves, captures, turn, array, x, y, x, y2)
				}
				
				let right = array[x + 1 + y1 * 8] & Color
				if (x < 7 && (right === White) !== turn[0] && right !== None)
					createPawnMoves(moves, captures, turn, array, x, y, x + 1, y1)
				
				let left = array[x - 1 + y1 * 8] & Color
				if (x > 0 && (left === White) !== turn[0] && left !== None)
					createPawnMoves(moves, captures, turn, array, x, y, x - 1, y1)
				
				break
			}
			
			case Knight:
				for (let [dx, dy] of knightSteps)
				{
					let x1 = x + dx
					let y1 = y + dy
					
					if (x1 < 0) continue
					if (y1 < 0) continue
					
					if (x1 > 7) continue
					if (y1 > 7) continue
					
					let other = array[x1 + y1 * 8] & Color
					if (other !== color) createMove(moves, captures, turn, array, x, y, x1, y1)
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
						if (other !== color) createMove(moves, captures, turn, array, x, y, x1, y)
						if (other !== None) break
					}
					for (let x1 = x - 1 ; x1 >= 0 ; x1--)
					{
						let other = array[x1 + y * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x1, y)
						if (other !== None) break
					}
					
					for (let y1 = y + 1 ; y1 < 8 ; y1++)
					{
						let other = array[x + y1 * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x, y1)
						if (other !== None) break
					}
					for (let y1 = y - 1 ; y1 >= 0 ; y1--)
					{
						let other = array[x + y1 * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x, y1)
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
						if (other !== color) createMove(moves, captures, turn, array, x, y, x + i, y + i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x + i > 7) break
						if (y - i < 0) break
						let other = array[(x + i) + (y - i) * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x + i, y - i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x - i < 0) break
						if (y + i > 7) break
						let other = array[(x - i) + (y + i) * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x - i, y + i)
						if (other !== None) break
					}
					for (let i = 1 ; true ; i++)
					{
						if (x - i < 0) break
						if (y - i < 0) break
						let other = array[(x - i) + (y - i) * 8] & Color
						if (other !== color) createMove(moves, captures, turn, array, x, y, x - i, y - i)
						if (other !== None) break
					}
				}
				
				break
			
			case King:
			{
				if (y > 0 && (array[(x + 0) + (y - 1) * 8] & Color) !== color)
					createMove(moves, captures, turn, array, x, y, x + 0, y - 1)
				if (y < 7 && (array[(x + 0) + (y + 1) * 8] & Color) !== color)
					createMove(moves, captures, turn, array, x, y, x + 0, y + 1)
				
				if (x > 0)
				{
					if ((array[(x - 1) + (y + 0) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x - 1, y + 0)
					if (y > 0 && (array[(x - 1) + (y - 1) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x - 1, y - 1)
					if (y < 7 && (array[(x - 1) + (y + 1) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x - 1, y + 1)
				}
				
				if (x < 7)
				{
					if ((array[(x + 1) + (y + 0) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x + 1, y + 0)
					if (y > 0 && (array[(x + 1) + (y - 1) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x + 1, y - 1)
					if (y < 7 && (array[(x + 1) + (y + 1) * 8] & Color) !== color)
						createMove(moves, captures, turn, array, x, y, x + 1, y + 1)
				}
				
				break
			}
		}
	}
	
	if (onlyCaptures) return captures
	return [...captures, ...moves]
}
