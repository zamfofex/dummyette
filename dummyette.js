// Constants for the algorithm.
let depth = 16
let limit = 4096
let backup = limit / 4

export let analyse = board =>
{
	let color = board.turn
	
	let branches = [{board, index: 0, score: board.getScore(color), value: 0, chance: 1}]
	
	let candidates = new Map()
	
	while (branches.length !== 0)
	{
		for (let {board, index, move, score, value, chance, chance0} of branches.splice(0, limit))
		{
			if (index > depth) continue
			
			if (index !== 0) candidates.get(move).scores.push({score, value, index})
			
			let self = board.turn === color
			
			if (board.checkmate)
			{
				let candidate = candidates.get(move)
				if (index === 0) break
				if (self) candidate.loss += chance0
				else candidate.win += chance
				continue
			}
			if (board.draw)
			{
				let candidate = candidates.get(move)
				if (index === 0) break
				candidate.draw += chance
				continue
			}
			
			chance0 = chance
			if (index !== 0) chance /= board.moves.length
			
			for (let move0 of board.moves)
			{
				if (index === 0)
					move = move0,
					candidates.set(move, {scores: [], win: 0, loss: 0, draw: 0})
				
				let board = move0.play()
				
				let score0 = board.getScore(color)
				score0 += Math.random() / 8 - 1/16
				
				let score1 = score
				score1 *= 1 - 1 / (index + 2)
				score1 += score0 / (index + 2)
				
				let value0 = score0 - score
				if (!self) value0 *= -1
				
				let value1 = value0
				value1 /= index + 1
				value1 +=  value * (1 - 1 / (index + 1))
				
				branches.push({board, index: index + 1, move, score: score1, value: value1, chance, chance0})
			}
		}
		
		branches.sort((a, b) => b.value - a.value)
		branches.length = Math.min(branches.length, limit + backup)
	}
	
	candidates = [...candidates]
	
	for (let [move, candidate] of candidates)
	{
		let {scores, win, loss, draw} = candidate
		
		let avg = 0
		let total = 0
		for (let {score, value, index} of scores)
		{
			let weight = 2 ** (value + index / depth / 8)
			avg += score * weight
			total += weight
		}
		avg /= total
		
		let score = avg +
			16 / (1 - win) - 16 +
			-16 / (1 - loss) + 16 +
			-16 / (1 - draw * 0.75) + 16
		
		// Account for 'NaN'.
		if (score !== score) score = -Infinity
		
		candidate.score = score
	}
	
	candidates.sort((a, b) => b[1].score - a[1].score)
	
	candidates = candidates.map(([move]) => move)
	
	Object.freeze(candidates)
	return candidates
}
