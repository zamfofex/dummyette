import {MutableBoard} from "./fast-chess.js"

let depth = 6
let spread = 8

export let analyse = board =>
{
	let turn = board.turn
	
	let traverse = (board, state, i) =>
	{
		let moves = board.getMoves()
		
		if (moves.length === 0)
		{
			if (board.isCheck())
			{
				if (i % 2 === 0)
					state.win++
				else
					state.loss++
			}
			else
			{
				state.draw++
			}
			return
		}
		
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
		
		if (i % 2 === 0)
			state.loss /= moves.length
		else
			state.win /= moves.length
		state.draw /= moves.length
	}
	
	let candidates = []
	
	for (let move of board.moves)
	{
		let state = {move, total: 0, count: 0, chance: 0, win: 0, loss: 0, draw: 0}
		let board = move.play()
		
		candidates.push(state)
		
		traverse(MutableBoard(board), state, 0)
	}
	
	for (let state of candidates)
	{
		let bias =
			+ 15 / (1 - state.win) - 15
			- 15 / (1 - state.loss) + 15
			- state.draw * 15
		
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
