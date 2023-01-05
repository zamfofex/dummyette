/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {traverse, serialize} from "./internal/analysis.js"
import {toGames} from "./notation/from-pgn.js"
import {sameBoard} from "./chess.js"

let registry = new FinalizationRegistry(f => f())

let pgn = await fetch(new URL("openings.pgn", import.meta.url))
if (!pgn.ok)
	console.warn("Openings could not be fetched.")

let openingGames = toGames(await pgn.text())
if (!openingGames)
	console.warn("Openings could not be parsed."),
	openingGames = []
if (!openingGames.every(Boolean))
	console.warn("Some openings could not be parsed.")

openingGames = openingGames.filter(Boolean)

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
	
	// note: these declarations need to be in their own scope.
	// note: this is to avoid them being added to the closure of 'terminate'.
	{
		let ready = Promise.all(workers.map(worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))))
		
		let evaluate = board => ready.then(() => evaluateAsync(board, workers))
		let analyse = board => evaluate(board).then(moves => Object.freeze(moves?.map(({move}) => move)))
		
		registry.register(evaluate, terminate)
		
		let result = {analyse, evaluate}
		Object.freeze(result)
		return result
	}
}

export let analyse = board =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let candidates = []
	
	for (let move of shuffle(board.moves))
		candidates.push({move, score: traverse(serialize(move.play()))})
	
	candidates.sort((a, b) => b.score - a.score)
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
			candidates.sort((a, b) => b.score - a.score)
			candidates = candidates.map(({move: [id, name], score}) => ({score, move: board.Move(name)}))
			
			outer:
			for (let {deltas} of openingGames)
			for (let {before, move} of deltas)
			{
				if (!sameBoard(board, before)) continue
				let i = candidates.findIndex(({move: {name}}) => name === move.name)
				let [evaluation] = candidates.splice(i, 1)
				candidates.unshift(evaluation)
				break outer
			}
			
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
		let board = move.play()
		if (board.draw)
		{
			candidates.push({move: [id, move], score: 0})
			continue
		}
		
		let worker = workers[i % workers.length]
		worker.postMessage([[id, move.name], serialize(board)])
		worker.addEventListener("message", receive)
	}
})

let shuffle = moves =>
{
	moves = moves.slice()
	let result = []
	while (moves.length !== 0)
		result.push(moves.splice([Math.floor(Math.random() * moves.length)], 1)[0])
	return result
}
