import {MutableBoard} from "./fast-chess.js"

export let analyse = board =>
{
	let turn = board.turn
	
	let traverse = (board, state, i) =>
	{
		if (i === 4)
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
					state.wins++
				else
					state.losses++
			}
			else
			{
				state.draws++
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
		next.length = Math.min(next.length, 4)
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
		let state = {move, total: 0, count: 0, ends: 0, wins: 0, losses: 0, draws: 0}
		let board = move.play()
		
		candidates.push(state)
		
		traverse(MutableBoard(board), state, 0)
	}
	
	for (let state of candidates)
	{
		let bias =
			+ 100 / (state.ends - state.wins) - (100 / state.ends)
			- 100 / (state.ends - state.losses) + (100 / state.ends)
			- state.draws * 50 / state.ends
		
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
