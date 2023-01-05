import {Board, Bitboards} from "./board.js"

let table = (n, white, black) =>
{
	let score = 0
	let whiteTable = tables[n][0]
	let blackTable = tables[n][1]
	for (let n of white) score += whiteTable.get(n)
	for (let n of black) score -= blackTable.get(n)
	return score
}

let depth = 2
let qdepth = 3

export let traverse = ({bitboards, whiteTurn}) =>
{
	let board = Board(bitboards, whiteTurn)
	
	// extend queen bitboards by the number of pawns on the board
	// - board.bitboards[8] (white queens)
	// - board.bitboards[0] (white pawns)
	// - board.bitboards[9] (black queens)
	// - board.bitboards[1] (black pawns)
	
	board.bitboards[8] = new BigUint64Array(
		board.bitboards[8].buffer,
		board.bitboards[8].byteOffset,
		board.bitboards[8].length + board.bitboards[0].length,
	)
	board.bitboards[9] = new BigUint64Array(
		board.bitboards[9].buffer,
		board.bitboards[9].byteOffset,
		board.bitboards[9].length + board.bitboards[1].length,
	)
	
	let evaluate = i =>
	{
		let score = 0
		for (let i = 0 ; i < 6 ; i++)
			score += table(i, board.bitboards[i * 2], board.bitboards[i * 2 + 1])
		
		if (!board.whiteTurn) score *= -1
		if (score < -5000) return -10000 * (depth - i + 1)
		return score
	}
	
	let quiesce = (i, alpha, beta) =>
	{
		let score = evaluate(i)
		if (score < -5000) return score
		if (i === -qdepth) return score
		
		if (score >= beta) return beta
		if (alpha < score) alpha = score
		
		for (let move of board.getMoves())
		{
			let token = board.play(move)
			if (token[0] === undefined)
			{
				board.unplay(move, token)
				continue
			}
			
			let score = -quiesce(i - 1, -beta, -alpha)
			board.unplay(move, token)
			
			if (score >= beta) return beta
			if (score > alpha) alpha = score
		}
		return alpha
	}
	
	let search = (i, alpha, beta) =>
	{
		let score = evaluate(i)
		if (score < -5000) return score
		if (i === 0) return quiesce(i, alpha, beta)
		
		for (let move of board.getMoves())
		{
			let token = board.play(move)
			let score = -search(i - 1, -beta, -alpha)
			board.unplay(move, token)
			
			if (score >= beta) return beta
			if (score > alpha) alpha = score
		}
		return alpha
	}
	
	return -search(depth, -Infinity, Infinity)
}

export let serialize = board => ({bitboards: Bitboards(board), whiteTurn: board.turn === "white"})

// tables from: <https://www.chessprogramming.org/Simplified_Evaluation_Function>

let pawnTable =
[
	[0, 0, 0, 0],
	[50, 50, 50, 50],
	[30, 20, 10, 10],
	[25, 10, 5, 5],
	[20, 0, 0, 0],
	[0, -10, -5, 5],
	[-20, 10, 10, 5],
	[0, 0, 0, 0],
]

let knightTable =
[
	[20, 15, 0, -30],
	[15, 10, 5, -30],
	[5, 0, -20, -40],
	[-30, -30, -40, -50],
]

let bishopTable =
[
	[-10, -10, -10, -20],
	[0, 0, 0, -10],
	[10, 5, 0, -10],
	[10, 5, 5, -10],
	[10, 10, 0, -10],
	[10, 10, 10, -10],
	[0, 0, 5, -10],
	[-10, -10, -10, -20],
]

let rookTable =
[
	[0, 0, 0, 0],
	[10, 10, 10, 5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[0, 0, 0, -5],
	[5, 0, 0, 0],
]

let queenTable =
[
	[5, 5, 0, -5],
	[5, 5, 0, -10],
	[0, 0, 0, -10],
	[-5, -10, -10, -20],
]

let kingMiddleGameTable =
[
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-50, -40, -40, -30],
	[-40, -30, -30, -20],
	[-20, -20, -20, -10],
	[0, 0, 20, 20],
	[0, 10, 30, 20],
]

// todo: this table is currently unused.
let kingEndGameTable =
[
	[40, 30, -10, -30],
	[30, 20, -10, -30],
	[0, 0, -30, -30],
	[-30, -30, -30, -50],
]

let tableScores = [[100, pawnTable], [320, knightTable], [330, bishopTable], [500, rookTable], [900, queenTable], [5999900, kingMiddleGameTable], [0, kingEndGameTable]]

for (let [score, table] of tableScores)
{
	for (let array of table)
	{
		for (let i of array.keys())
			array[i] += score,
			array[i] /= 100
		
		let others = [...array]
		others.reverse()
		array.unshift(...others)
	}
	
	if (table.length === 4)
	{
		let others = [...table]
		others.reverse()
		table.unshift(...others)
	}
}

let tables = []

for (let [score, table] of tableScores)
{
	let array = []
	tables.push(array)
	for (let i of [0, 1])
	{
		let map = new Map()
		array.push(map)
		map.set(0n, 0)
		
		for (let x = 0 ; x < 8 ; x++)
		for (let y = 0 ; y < 8 ; y++)
		{
			let y0 = y
			if (i === 0) y0 = 7 - y
			let score = table[y0][x]
			map.set(1n << BigInt(x + y * 8), score)
		}
	}
}
