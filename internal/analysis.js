let depth = 4
let spread = 16

export let traverse = (turn, board, i) =>
{
	let moves = board.getMoves()
	
	if (moves.length === 0)
	{
		if ((i % 2 === 0) === board.isCheck())
			return [Infinity, i]
		else
			return [-Infinity, i]
	}
	
	let boardScore = board.getScore()
	if (i === depth)
	{
		if (turn === "black") boardScore *= -1
		return [boardScore + Math.random() - 0.5]
	}
	
	let captures = []
	let next = Array(moves.length).fill()
	for (let [j, move] of moves.entries())
	{
		move.play()
		
		let moveScore = board.getScore()
		let info = {move, score: moveScore + Math.random() - 0.5}
		if ((i % 2 === 0) !== (turn === "black")) info.score *= -1
		
		if (moveScore !== boardScore) captures.push(info)
		next[j] = info
		
		move.unplay()
	}
	
	next.sort((a, b) => b.score - a.score)
	next.length = Math.min(next.length, Math.round(spread * (depth - i) / depth))
	
	next.push(...captures)
	
	let score
	let minimax
	
	if	(i % 2 === 0)
		score = Infinity,
		minimax = Math.min
	else
		score = -Infinity,
		minimax = Math.max
	
	for (let {move} of new Set(next))
	{
		move.play()
		score = minimax(score, traverse(turn, board, i + 1)[0])
		move.unplay()
	}
	
	return [score]
}
