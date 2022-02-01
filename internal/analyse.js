let depth = 4
let spread = 16

export let traverse = (turn, board, state, i) =>
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
	
	let score = board.getScore()
	if (turn === "black") score *= -1
	
	state.count++
	state.total += score
	
	let next = Array(moves.length).fill()
	for (let [j, move] of moves.entries())
	{
		move.play()
		let score = board.getScore()
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
		traverse(turn, board, state, i + 1)
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
