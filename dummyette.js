export let analyse = board =>
{
	let color = board.turn
	
	let traverse = (board, state, i) =>
	{
		if (i === 4)
		{
			state.ends++
			return
		}
		
		if (board.checkmate)
		{
			state.ends++
			if (board.turn === color)
				state.losses++
			else
				state.wins++
			return
		}
		
		if (board.draw)
		{
			state.ends++
			state.draws++
			return
		}
		
		state.count++
		state.total += board.getScore(color) + Math.random() - 0.5
		
		let next = []
		for (let move of board.moves)
		{
			let board = move.play()
			let score = board.getScore() + Math.random() - 0.5
			next.push({board, score})
		}
		
		next.sort((a, b) => b.score - a.score)
		next.length = Math.min(next.length, 4)
		for (let {board, score} of next)
			traverse(board, state, i + 1)
	}
	
	let candidates = []
	
	for (let move of board.moves)
	{
		let state = {move, total: 0, count: 0, ends: 0, wins: 0, losses: 0, draws: 0}
		let board = move.play()
		
		candidates.push(state)
		
		traverse(board, state, 0)
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
