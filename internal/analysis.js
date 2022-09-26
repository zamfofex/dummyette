import {Board, Bitboards} from "./board.js"

export let traverse = ({bitboards, whiteTurn}) =>
{
	let board = Board(bitboards, whiteTurn)
	
	let negamax = depth =>
	{
		let score = board.whiteScore - board.blackScore
		if (Math.abs(score) > 5000) return [-Infinity, depth]
		
		if (depth === 0)
		{
			if (whiteTurn !== (maxDepth % 2 === 0)) score *= -1
			return [score]
		}
		
		let max = [-Infinity]
		for (let move of board.getMoves())
		{
			let token = board.play(move)
			let [score, depth2] = negamax(depth - 1)
			if (-score > max[0]) max = [-score, depth2]
			board.unplay(move, token)
		}
		return max
	}
	
	let maxDepth = 4
	let result = negamax(maxDepth)
	result[0] *= -1
	result[1] = maxDepth - result[1]
	return result
}

export let serialize = board => ({bitboards: Bitboards(board), whiteTurn: board.turn === "white"})
