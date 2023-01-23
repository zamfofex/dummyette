/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {MutableBoard} from "./internal/fast-chess.js"
import {toGames} from "./notation/from-pgn.js"
import {sameBoard} from "./variants.js"
import {isStalemate, isCheckmate} from "./variants/chess.js"

let registry = new FinalizationRegistry(f => f())

let pgn = await fetch(new URL("openings.pgn", import.meta.url))
let openingGames

if (pgn.ok)
{
	openingGames = toGames(await pgn.text())
	if (!openingGames)
	{
		console.warn("Openings could not be parsed.")
		openingGames = []
	}
}
else
{
	console.warn("Openings could not be fetched.")
	openingGames = []
}

if (!openingGames.every(Boolean))
	console.warn("Some openings could not be parsed.")

openingGames = openingGames.filter(Boolean)

export let AsyncAnalyser = ({workers: workerCount = navigator.hardwareConcurrency} = {}) =>
{
	workerCount = Number(workerCount)
	if (!Number.isInteger(workerCount)) return
	if (workerCount <= 0) return
	
	let workers = Array(workerCount).fill().map(() => new Worker(new URL("internal/worker.js", import.meta.url), {type: "module"}))
	
	let promises = new Set()
	let terminate = async () =>
	{
		await Promise.all(promises)
		for (let worker of workers)
			worker.terminate()
	}
	
	// note: these declarations need to be in their own scope.
	// note: this is to avoid them being added to the closure of 'terminate'.
	{
		let ready = Promise.all(workers.map(worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))))
		
		let analyse = (board, options = {}) => evaluate(board).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
		let evaluate = (board, {time = 60} = {}) =>
		{
			let promise = ready.then(() =>
			{
				let openingEvaluations = prioritizeOpenings(board)
				if (openingEvaluations) return openingEvaluations
				return evaluateAsync(board, workers, time)
			})
			
			promise.finally(() => promises.delete(promise))
			promises.add(promise)
			
			return promise
		}
		
		registry.register(evaluate, terminate)
		
		let result = {analyse, evaluate}
		Object.freeze(result)
		return result
	}
}

export let analyse = (board, options = {}) => evaluate(board, options).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
export let evaluate = (board, {workers = navigator.hardwareConcurrency, time = 60} = {}) => AsyncAnalyser({workers}).evaluate(board, {time})

let prioritizeOpenings = board =>
{
	let moves = new Set()
	
	for (let {deltas} of openingGames)
	for (let {before, move} of deltas)
	{
		if (!sameBoard(board, before)) continue
		moves.add(board.Move(move))
	}
	
	if (moves.size === 0) return
	
	let otherMoves = new Set(board.moves)
	for (let move of moves) otherMoves.delete(move)
	
	let evaluations = [...shuffle([...moves]), ...shuffle([...otherMoves])].map(move => ({move, score: 0}))
	Object.freeze(evaluations)
	return evaluations
}

let evaluateAsync = async (board, workers, time) =>
{
	if (board.storage.geometry.info.width !== 8) return
	if (board.storage.geometry.info.height !== 8) return
	
	time = Number(time)
	if (!Number.isFinite(time)) return
	if (time < 0) return
	time *= 1000
	time += performance.now()
	
	if (board.moves.length <= 1)
		return evaluate0(board, workers, 0)
	
	let moves = shuffle(board.moves)
	let i = 0
	let previousTime = performance.now()
	while (true)
	{
		let start = performance.now()
		let evaluations = await evaluate0(board, workers, i++, moves)
		let now = performance.now()
		let ellapsed = now - start
		
		if (now > time) return evaluations
		if (evaluations[0].score > 900) return evaluations
		
		moves = evaluations.map(({move}) => move)
		if (ellapsed * 32 > time - now) return evaluations
	}
}

let i = 0

let evaluate0 = (board, workers, depth, moves = shuffle(board.moves)) => new Promise(resolve =>
{
	let id = i++
	
	let receive = ({data: state}) =>
	{
		if (state.move[0] !== id) return
		
		evaluations.push(state)
		
		if (evaluations.length === length)
		{
			evaluations.sort((a, b) => b.score - a.score)
			evaluations = evaluations.map(({move: [id, name], score}) => ({score, move: board.Move(name)}))
			
			Object.freeze(evaluations)
			resolve(evaluations)
			
			for (let worker of workers)
				worker.removeEventListener("message", receive)
		}
	}
	
	let length = moves.length
	
	if (length === 0)
	{
		let evaluations = []
		Object.freeze(evaluations)
		resolve(evaluations)
		return
	}
	
	let evaluations = []
	
	let count = 0
	for (let [i, move] of moves.entries())
	{
		let board = move.play()
		if (isStalemate(board))
		{
			evaluations.push({move: [id, move], score: 0})
			continue
		}
		if (isCheckmate(board))
		{
			evaluations.push({move: [id, move], score: 5000000})
			continue
		}
		
		let worker = workers[i % workers.length]
		worker.postMessage([[id, move.name], MutableBoard(board).serialize(), depth])
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
