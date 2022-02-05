/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {MutableBoard} from "./fast-chess.js"
import {traverse} from "./internal/analysis.js"

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

export let analyse = board =>
{
	let candidates = []
	
	for (let move of board.moves)
		candidates.push(traverse(board.turn, MutableBoard(move.play()), move, 0))
	
	candidates.sort((a, b) => b.score - a.score)
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
			candidates.sort((a, b) => b.score - a.score)
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
