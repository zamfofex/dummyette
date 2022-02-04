/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {MutableBoard} from "./fast-chess.js"
import {traverse} from "./internal/analyse.js"

let registry = new FinalizationRegistry(f => f())

export let AsyncAnalyser = ({workers = navigator.hardwareConcurrency} = {}) =>
{
	workers = Number(workers)
	if (Math.round(workers) !== workers) return
	if (workers <= 0) return
	
	workers = Array(workers).fill().map(() => new Worker(new URL("internal/worker.js", import.meta.url), {type: "module", deno: {namespace: true}}))
	
	let terminate = () =>
	{
		for (let worker of workers)
			worker.terminate()
		workers = null
	}
	
	let ready = Promise.all(workers.map(worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))))
	
	{
		let analyse = board => ready.then(() => analyseAsync(board, workers))
		
		registry.register(analyse, terminate)
		
		let result = {analyse}
		Object.freeze(result)
		return result
	}
}

let sortCandidates = candidates =>
{
	for (let state of candidates)
	{
		let bias =
			+ 5 / (1 - state.win) - 5
			- 15 / (1 - state.loss) + 15
			- state.draw * 10
		
		state.score = state.total / state.count + bias
		
		if (state.score !== state.score)
			if (bias > 0)
				state.score = Infinity
			else
				state.score = -Infinity
	}
	
	candidates.sort((a, b) => (b.score - a.score) || 0)
}

export let analyse = board =>
{
	let candidates = []
	
	for (let move of board.moves)
	{
		let state = {move, total: 0, count: 0, chance: 0, win: 0, loss: 0, draw: 0}
		candidates.push(state)
		traverse(board.turn, MutableBoard(move.play()), state, 0)
	}
	
	sortCandidates(candidates)
	candidates = candidates.map(({move}) => move)
	
	Object.freeze(candidates)
	return candidates
}

let id = 0

let analyseAsync = (board, workers) => new Promise(resolve =>
{
	id++
	
	let receive = ({data: state}) =>
	{
		if (state.move[0] !== id) return
		
		candidates.push(state)
		
		if (candidates.length === length)
		{
			sortCandidates(candidates)
			candidates = candidates.map(({move: [id, name]}) => board.Move(name))
			
			Object.freeze(candidates)
			resolve(candidates)
			
			for (let worker of workers)
				worker.removeEventListener("message", receive)
		}
	}
	
	let length = board.moves.length
	
	if (length === 0)
	{
		let result = []
		Object.freeze(result)
		resolve(result)
		return
	}
	
	let candidates = []
	
	let count = 0
	for (let [i, move] of board.moves.entries())
	{
		let worker = workers[i % workers.length]
		let json = MutableBoard(move.play()).toJSON()
		worker.postMessage([board.turn, [id, move.name], json])
		worker.addEventListener("message", receive)
	}
})
