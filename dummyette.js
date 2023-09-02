/// <reference path="./types/dummyette.d.ts" />
/// <reference types="./types/dummyette.d.ts" />

import {MutableBoard} from "./internal/fast-chess.js"
import {toGames} from "./notation/from-pgn.js"
import {sameBoard} from "./chess.js"
import {confidence} from "./internal/analysis.js"

let registry = new FinalizationRegistry(f => f())

let nextMessage = worker => new Promise(resolve => worker.addEventListener("message", resolve, {once: true}))

let terminate = workers => () =>
{
	for (let worker of workers)
		worker.terminate()
}

export let AsyncAnalyser = ({workers: workerCount = navigator.hardwareConcurrency} = {}) =>
{
	workerCount = Number(workerCount)
	if (!Number.isInteger(workerCount)) return
	if (workerCount <= 0) return
	
	let workers = Array(workerCount).fill().map(() => new Worker(new URL("internal/worker.js", import.meta.url), {type: "module"}))
	let promise = Promise.all(workers.map(nextMessage)).then(() => promise = Promise.resolve())
	
	let promises = new Set()
	
	let createAnalysis = (board, nodes = []) =>
	{
		if (board.width !== 8) return
		if (board.height !== 8) return
		
		let moves = shuffle(board.moves)
		
		let infos = new Map(moves.map(({name}) => [name, {score: -Infinity}]))
		for (let node of nodes)
		{
			let info = infos.get(node.name)
			if (info) info.node = node
		}
		
		let confidenceX = move =>
		{
			let {node} = infos.get(move.name)
			if (!node) return Infinity
			return confidence(node)
		}
		
		let resultingMoves
		let evaluations
		let setEvaluations = () =>
		{
			evaluations = moves.slice().map(move => ({move, score: infos.get(move.name).score}))
			evaluations.sort((a, b) => (b.score - a.score) || 0)
			resultingMoves = evaluations.map(({move}) => move)
			Object.freeze(resultingMoves, evaluations)
		}
		
		setEvaluations()
		
		let status = "paused"
		let pausing
		let paused
		
		let startAsync = async () =>
		{
			while (status === "running")
			{
				let promises = []
				let parent = {visits: 0}
				let result = await distribute(board, workers, infos, moves.slice(0, workerCount))
				for (let {move, node, score} of result)
				{
					parent.visits += node.visits
					node.parent = parent
					Object.assign(infos.get(move), {node, score})
				}
				moves.sort((a, b) => (confidenceX(b) - confidenceX(a)) || 0)
				setEvaluations()
			}
			status = "paused"
			paused()
		}
		
		let start = () =>
		{
			if (status === "running") return
			status = "running"
			return promise.then(startAsync)
		}
		
		let pause = () =>
		{
			if (status === "paused") return
			if (status === "pausing") return pausing
			status = "pausing"
			pausing = new Promise(f => paused = f)
			return pausing
		}
		
		let playSync = move =>
		{
			move = board.Move(move)
			if (!move) return
			let {node} = infos.get(move.name)
			if (!node) return createAnalysis(move.play())
			for (let child of node.children)
				child.parent = node
			return createAnalysis(move.play(), node.children)
		}
		
		let play = move =>
		{
			if (status === "paused") return playSync(move)
			return pause().then(() => playSync(move))
		}
		
		let analysis = {board, start, pause, play, get moves() { return resultingMoves }, get evaluations() { return evaluations }}
		Object.freeze(analysis)
		return analysis
	}
	
	let Analysis = board => createAnalysis(board)
	
	let analyse = (board, options = {}) => evaluate(board, options).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
	let evaluate = (board, {time = 60} = {}) =>
	{
		time = Number(time)
		if (!Number.isFinite(time)) return
		if (time < 0) return
		
		let analysis = Analysis(board)
		if (!analysis) return
		analysis.start()
		return new Promise(resolve => setTimeout(resolve, time * 1000))
			.then(() => analysis.pause())
			.then(() => analysis.evaluations)
	}
	
	// todo: improve termination handling
	registry.register(createAnalysis, terminate(workers))
	
	let result = {analyse, evaluate, Analysis}
	Object.freeze(result)
	return result
}

export let analyse = (board, options = {}) => evaluate(board, options).then(evaluations => Object.freeze(evaluations?.map(({move}) => move)))
export let evaluate = (board, {workers = navigator.hardwareConcurrency, time = 60} = {}) => AsyncAnalyser({workers}).evaluate(board, {time})

let maxConfidence = {score: 1, visits: Infinity, parent: {visits: 0}}

let i = 0n
let distribute = (board, workers, infos, moves) => new Promise(resolve =>
{
	let id = i++
	
	let receive = ({data: {move, node, score}}) =>
	{
		if (move[0] !== id) return
		
		evaluations.push({move: move[1], node, score})
		if (evaluations.length !== length) return
		resolve(evaluations)
		for (let worker of workers)
			worker.removeEventListener("message", receive)
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
		if (board.draw)
		{
			evaluations.push({move: move.name, score: 0, node: maxConfidence})
			continue
		}
		if (board.checkmate)
		{
			evaluations.push({move: move.name, score: Infinity, node: maxConfidence})
			continue
		}
		
		let worker = workers[i % workers.length]
		worker.postMessage([[id, move.name], MutableBoard(board).serialise(), infos.get(move.name).node])
		worker.addEventListener("message", receive)
	}
})

let shuffle = values =>
{
	values = values.slice()
	let result = []
	while (values.length !== 0)
		result.push(values.splice([Math.floor(Math.random() * values.length)], 1)[0])
	return result
}
