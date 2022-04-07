/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {traverse, serialize} from "./internal/analysis.js"

let registry = new FinalizationRegistry(f => f())

export let AsyncAnalyser = ({workers = navigator.hardwareConcurrency} = {}) =>
{
	workers = Number(workers)
	if (Math.round(workers) !== workers) return
	if (workers <= 0) return
	
	workers = Array(workers).fill().map(() => new Worker(new URL("internal/worker.js", import.meta.url), {type: "module"}))
	
	let terminate = () =>
	{
		for (let worker of workers)
			worker.terminate()
		workers = null
	}
	
	let ready = Promise.all(workers.map(worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))))
	
	let evaluate = board => ready.then(() => evaluateAsync(board, workers))
	let analyse = board => evaluate(board).then(moves => Object.freeze(moves?.map(({move}) => move)))
	
	registry.register(evaluate, terminate)
	
	let result = {analyse, evaluate}
	Object.freeze(result)
	return result
}

export let analyse = board =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let candidates = []
	
	for (let move of shuffle(board.moves))
		candidates.push({move, score: traverse(serialize(move.play(), board))})
	
	candidates.sort(compare)
	candidates = candidates.map(({move}) => move)
	
	Object.freeze(candidates)
	return candidates
}

let i = 0

let evaluateAsync = (board, workers) => new Promise(resolve =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let id = i++
	
	let receive = ({data: state}) =>
	{
		if (state.move[0] !== id) return
		
		candidates.push(state)
		
		if (candidates.length === length)
		{
			candidates.sort(compare)
			candidates = candidates.map(({move: [id, name], score: [score]}) => ({score, move: board.Move(name)}))
			
			Object.freeze(candidates)
			resolve(candidates)
			
			for (let worker of workers)
				worker.removeEventListener("message", receive)
		}
	}
	
	let moves = shuffle(board.moves)
	let length = moves.length
	
	if (length === 0)
	{
		let result = []
		Object.freeze(result)
		resolve(result)
		return
	}
	
	let candidates = []
	
	let count = 0
	for (let [i, move] of moves.entries())
	{
		let worker = workers[i % workers.length]
		worker.postMessage([[id, move.name], serialize(move.play(), board)])
		worker.addEventListener("message", receive)
	}
})

let compare = ({score: [a, i]}, {score: [b, j]}) =>
{
	let result = b - a
	if (Number.isNaN(result))
	{
		if (a > 0)
			return i - j
		else
			return j - i
	}
	return result
}

let shuffle = moves =>
{
	moves = moves.slice(0)
	let result = []
	while (moves.length !== 0)
		result.push(moves.splice([Math.floor(Math.random() * moves.length)], 1)[0])
	return result
}
