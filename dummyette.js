import {MutableBoard} from "./fast-chess.js"

let depth = 6
let spread = 8

export let analyse = board =>
{
	let turn = board.turn
	
	let traverse = (board, state, i) =>
	{
		if (i === depth)
		{
			state.ends++
			return
		}
		
		let moves = board.getMoves()
		
		if (moves.length === 0)
		{
			state.ends++
			if (board.isCheck())
			{
				if (i % 2 === 0)
					state.wins += state.chance
				else
					state.losses += state.chance0
			}
			else
			{
				state.draws += state.chance
			}
			return
		}
		
		state.chance0 = state.chance
		state.chance /= moves.length
		
		let score = board.getScore() + Math.random() - 0.5
		if (turn === "black") score *= -1
		
		state.count++
		state.total += score
		
		let next = []
		for (let move of moves)
		{
			move.play()
			let score = board.getScore() + Math.random() - 0.5
			if ((i % 2 === 0) !== (turn === "black")) score *= -1
			next.push({move, score})
			move.unplay()
		}
		
		next.sort((a, b) => b.score - a.score)
		next.length = Math.min(next.length, Math.round(spread * (depth - i) / depth))
		for (let {move} of next)
		{
			move.play()
			traverse(board, state, i + 1)
			move.unplay()
		}
	}
	
	let candidates = []
	
	for (let move of board.moves)
	{
		let state = {move, total: 0, count: 0, chance: 1, wins: 0, losses: 0, draws: 0}
		let board = move.play()
		
		candidates.push(state)
		
		traverse(MutableBoard(board), state, 0)
	}
	
	for (let state of candidates)
	{
		let bias =
			+ 15 / (1 - state.wins) - 15
			- 15 / (1 - state.losses) + 15
			- state.draws * 15
		
		state.score = state.total / state.count + bias
		
		if (state.score !== state.score)
			if (bias > 0)
				state.score = Infinity
			else
				state.score = -Infinity
	}
	
	candidates.sort((a, b) => (b.score - a.score) || 0)
	
	candidates = candidates.map(({move}) => move)
	
	Object.freeze(candidates)
	return candidates
}
