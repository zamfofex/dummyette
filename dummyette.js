/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {serialize} from "./internal/analysis.js"
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

export let AsyncAnalyser = ({workers: workerCount = navigator.hardwareConcurrency} = {}) =>
{
	workerCount = Number(workerCount)
	if (!Number.isInteger(workerCount)) return
	if (workerCount <= 0) return
	
	let workers = Array(workerCount).fill().map(() => new Worker(new URL("internal/worker.js", import.meta.url), {type: "module"}))
	
	let terminate = () =>
	{
		for (let worker of workers)
			worker.terminate()
	}
	
	// note: these declarations need to be in their own scope.
	// note: this is to avoid them being added to the closure of 'terminate'.
	{
		let ready = Promise.all(workers.map(worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))))
		
		let analyse = (board, options = {}) => evaluate(board).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
		let evaluate = async (board, {time} = {}) =>
		{
			await ready
			
			if (time !== undefined)
			{
				time = Number(time)
				if (!Number.isFinite(time)) return
				if (time < 0) return
				time *= 1000
				time += performance.now()
			}
			
			if (board.moves.length <= 1)
			{
				let result = await evaluateAsync(board, workers, 0)
				return result.evaluations
			}
			
			if (time === undefined)
			{
				let result = await evaluateAsync(board, workers)
				return result.evaluations
			}
			
			let moves = shuffle(board.moves)
			let i = 0
			let previousTime = performance.now()
			while (true)
			{
				let start = performance.now()
				let result = await evaluateAsync(board, workers, i++, moves)
				let now = performance.now()
				let ellapsed = now - start
				
				if (result.book) return result.evaluations
				if (now > time) return result.evaluations
				if (result.evaluations[0].score > 900) return result.evaluations
				
				moves = result.evaluations.slice(0, Math.floor(Math.exp(-i) * 64 + 4)).map(({move}) => move)
				if (ellapsed * 32 > time - now) return result.evaluations
			}
		}
		
		registry.register(evaluate, terminate)
		
		let result = {analyse, evaluate}
		Object.freeze(result)
		return result
	}
}

export let analyse = (board, options = {}) => evaluate(board, options).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
export let evaluate = async (board, {workers = navigator.hardwareConcurrency, time} = {}) => AsyncAnalyser({workers}).evaluate(board, {time})

let i = 0

let evaluateAsync = (board, workers, depth = 2, moves = shuffle(board.moves)) => new Promise(resolve =>
{
	if (board.width !== 8) return
	if (board.height !== 8) return
	
	let id = i++
	
	let receive = ({data: state}) =>
	{
		if (state.move[0] !== id) return
		
		evaluations.push(state)
		
		if (evaluations.length === length)
		{
			evaluations.sort((a, b) => b.score - a.score)
			evaluations = evaluations.map(({move: [id, name], score}) => ({score, move: board.Move(name)}))
			
			let book
			outer:
			for (let {deltas} of openingGames)
			for (let {before, move} of deltas)
			{
				if (!sameBoard(board, before)) continue
				let i = evaluations.findIndex(({move: {name}}) => name === move.name)
				let [evaluation] = evaluations.splice(i, 1)
				evaluations.unshift(evaluation)
				book = true
				break outer
			}
			
			Object.freeze(evaluations)
			resolve({evaluations, book})
			
			for (let worker of workers)
				worker.removeEventListener("message", receive)
		}
	}
	
	let length = moves.length
	
	if (length === 0)
	{
		let evaluations = []
		Object.freeze(evaluations)
		resolve({evaluations})
		return
	}
	
	let evaluations = []
	
	let count = 0
	for (let [i, move] of moves.entries())
	{
		let board = move.play()
		if (board.draw)
		{
			evaluations.push({move: [id, move], score: 0})
			continue
		}
		if (board.checkmate)
		{
			evaluations.push({move: [id, move], score: 5000000})
			continue
		}
		
		let worker = workers[i % workers.length]
		worker.postMessage([[id, move.name], serialize(board), depth])
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
