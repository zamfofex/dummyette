import {MutableBoard} from "./fast-chess.js"

let depth = 4
let spread = 16

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
		
		let next = Array(moves.length).fill()
		for (let [j, move] of moves.entries())
		{
			move.play()
			let score = board.getScore() + Math.random() - 0.5
			if ((i % 2 === 0) !== (turn === "black")) score *= -1
			next[j] = {move, score}
			move.unplay()
		}
		
		next.sort((a, b) => b.score - a.score)
		next.length = Math.min(next.length, Math.round(spread * (depth - i) / depth))
		for (let {move} of next)
		{
			let {win, loss} = state
			state.win = 0
			state.loss = 0
			
			move.play()
			traverse(board, state, i + 1)
			move.unplay()
			
			if (i % 2 === 0)
			{
				state.win /= moves.length
				state.win += win
				
				state.loss = 1 - (1 - state.loss) * (1 - loss)
			}
			else
			{
				state.loss /= moves.length
				state.loss += loss
				
				state.win = 1 - (1 - state.win) * (1 - win)
			}
		}
		
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
