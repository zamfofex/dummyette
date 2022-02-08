/// <reference path="./types/lichess.d.ts" />
/// <reference types="./types/lichess.d.ts" />

import {Color, standardBoard, other} from "./chess.js"
import {RewindJoinStream} from "./streams.js"
import {splitBrowserStream} from "./streams-browser.js"

export let Lichess = async token =>
{
	token = String(token)
	let headers = {authorization: token}
	
	let response = await fetch("https://lichess.org/api/account", {headers})
	if (!response.ok) return
	
	let info = await response.json()
	if (!info) return
	if (!info.id) return
	
	let username = info.id
	
	let events = await streamURL(headers, "https://lichess.org/api/stream/event")
	if (!events) return
	
	events.last.then(() =>
	{
		console.error("The lichess event stream was broken, finalizing the process.")
		Deno.exit(-1)
	})
	
	let StockfishGame = async (level = 1, color = "random") =>
	{
		level = Number(level)
		if (Math.floor(level) !== level) return
		if (level < 1) return
		if (level > 8) return
		level = String(level)
		
		if (color !== "random")
			color = Color(color)
		if (!color) return
		
		let response = await fetch("https://lichess.org/api/challenge/ai", {method: "POST", headers, body: new URLSearchParams({level, color})})
		if (!response.ok) return
		
		let {id} = await response.json()
		return createGame(headers, username, id)
	}
	
	let challenges = events
		.filter(event => event.type === "challenge")
		.map(event => event.challenge)
		.filter(challenge => validateChallenge(headers, challenge))
		.map(challenge => createChallenge(headers, username, events, challenge))
	
	let getGameIDs = async () =>
	{
		let response = await fetch("https://lichess.org/api/account/playing", {headers})
		if (!response.ok) return
		let {nowPlaying} = await response.json()
		let ids = nowPlaying.map(({gameId}) => gameId)
		Object.freeze(ids)
		return ids
	}
	
	let getGames = async () =>
	{
		let ids = await getGameIDs()
		let promises = ids.map(id => createGame(headers, username, id)).filter(Boolean)
		let games = await Promise.all(promises)
		Object.freeze(games)
		return games
	}
	
	let getGame = id =>
	{
		id = String(id)
		if (!/^[a-z0-9]{8}$/i.test(id)) return
		return createGame(headers, username, id)
	}
	
	let declineChallenges = reason => { challenges.forEach(challenge => { challenge.decline(reason) }) }
	
	let acceptChallenges = () => challenges.map(challenge => challenge.accept(), {parallel: true}).filter(Boolean)
	
	let challenge = async (otherUsername, {rated = false, time = "unlimited", color = "random"} = {}) =>
	{
		otherUsername = String(otherUsername)
		rated = Boolean(rated)
		if (color !== "random")
			color = Color(color)
		
		if (!color) return
		
		if (typeof time === "string")
			time = parseTime(time)
		else
			time = normalizeTime(time)
		
		if (!time) return
		
		let stream = await streamURL(headers, `https://lichess.org/api/challenge/${otherUsername}`, JSON.stringify({...time, rated, color, keepAliveStream: true}))
		
		let info = await stream.first
		if (!info) return
		if (!info.challenge) return
		let id = info.challenge.id
		
		await stream.last
		return createGame(headers, username, id)
	}
	
	let lichess =
	{
		StockfishGame, challenges, username, getGame,
		getGames, getGameIDs,
		declineChallenges, acceptChallenges,
		challenge,
	}
	Object.freeze(lichess)
	return lichess
}

let createGame = async (headers, username, id) =>
{
	let gameEvents = await streamURL(headers, `https://lichess.org/api/bot/game/stream/${id}`)
	if (!gameEvents) return
	gameEvents = RewindJoinStream(gameEvents)
	
	let resign = async () =>
	{
		let response = await fetch(`https://lichess.org/api/bot/game/${id}/resign`, {method: "POST", headers})
		return response.ok
	}
	
	let n = 0
	let handle = async function * (names)
	{
		names = names.split(" ").slice(n)
		for (let name of names)
		{
			let turn = board.turn
			board = board.play(name)
			if (!board)
			{
				await resign()
				console.error(`Unexpected move in game, finalizing process: ${name}`)
				Deno.exit(-1)
			}
			
			let result = {moveName: name, move: name, board, turn, moveNumber: Math.floor(n / 2)}
			Object.freeze(result)
			n++
			yield result
		}
	}
	
	let board = standardBoard
	let status = "ongoing"
	
	let full = await gameEvents.first
	if (full.type !== "gameFull") return
	
	let {white: {id: whiteUsername}, black: {id: blackUsername}, initialFen} = full
	
	if (initialFen !== "startpos")
	{
		resign()
		return
	}
	
	let history = RewindJoinStream([full.state], gameEvents)
		.filter(event => event.type === "gameState")
		.flatMap(event => [{moves: event.moves}, {done: !["created", "started"].includes(event.status)}])
		.takeWhile(({done}) => !done)
		.map(({moves}) => moves)
		.filter(Boolean)
		.flatMap(moves => handle(moves))
	
	let moveNames = history.map(({moveName}) => moveName)
	let boards = RewindJoinStream([standardBoard], history.map(({board}) => board))
	
	boards.last.then(board =>
	{
		if (board.moves.length === 0)
			if (board.checkmate)
				status = "checkmate"
			else
				status = "draw"
		else
			status = "aborted"
	})
	
	if (full.state.moves) await boards.at(full.state.moves.split(" ").length)
	
	let play = async (...names) =>
	{
		let played = 0
		for (let name of names)
		{
			name = String(name)
			if (!/^[a-z0-9]+$/.test(name)) break
			let response = await fetch(`https://lichess.org/api/bot/game/${id}/move/${name}`, {method: "POST", headers})
			if (!response.ok) break
			played++
		}
		return played
	}
	
	let color = null
	if (whiteUsername === username) color = "white"
	if (blackUsername === username) color = "black"
	
	let game =
	{
		id,
		moveNames, moves: moveNames,
		history, boards,
		play, resign,
		blackUsername, whiteUsername,
		color,
		get board() { return board },
		get status() { return status },
		get turn() { return board.turn },
		get finished() { return status !== "ongoing" },
		get ongoing() { return status === "ongoing" },
	}
	
	Object.freeze(game)
	return game
}

let createChallenge = async (headers, username, events, {id, rated, color, variant: {key: variant}, timeControl: {type: timeControl}}) =>
{
	let accept = async () =>
	{
		let gamePromise = events.find(event => event.type === "gameStart" && event.game.id === id)
		
		let response = await fetch(`https://lichess.org/api/challenge/${id}/accept`, {method: "POST", headers})
		if (!response.ok) return
		await gamePromise
		return createGame(headers, username, id)
	}
	
	let decline = async reason =>
	{
		if (reason === undefined) reason = "generic"
		reason = String(reason)
		let response = await fetch(`https://lichess.org/api/challenge/${id}/decline`, {method: "POST", headers, body: new URLSearchParams({reason})})
		return response.ok
	}
	
	let challenge = {id, variant, rated, timeControl, accept, decline, color}
	Object.freeze(challenge)
	return challenge
}

let validateChallenge = (headers, {id, variant}) =>
{
	if (variant.key !== "standard")
	{
		fetch(`https://lichess.org/api/challenge/${id}/decline`, {method: "POST", headers, body: new URLSearchParams({reason: "standard"})})
		return false
	}
	return true
}

let parseTime = string =>
{
	if (string === "unlimited") return {}
	if (string.endsWith("d"))
	{
		string = string.replace(/^0+/, "")
		string = string.slice(0, -1)
		if (string.length > 2) return
		if (string.length === 0) return
		if (/[^0-9]/.test(string)) return
		return {days: Number(string)}
	}
	let match = string.match(/^([0-9]*)(?::([0-9]+))?\+([0-9]+)$/)
	if (!match) return
	
	let [{}, minutes, seconds, increment] = match
	if (!minutes) minutes = 0
	if (!seconds) seconds = 0
	
	minutes = Number(minutes)
	seconds = Number(seconds)
	increment = Number(increment)
	
	return normalizeTime({limit: minutes * 60 + seconds, increment})
}

let normalizeTime = ({limit = Infinity, increment = 0}) =>
{
	limit = Number(limit)
	increment = Number(increment)
	
	if (limit <= 0) return
	if (increment < 0) return
	
	limit = Math.ceil(limit)
	increment = Math.floor(increment)
	
	if (limit === Infinity) return {}
	if (increment === Infinity) return {}
	
	if (!Number.isFinite(limit)) return
	if (!Number.isFinite(increment)) return
	
	return {clock: {limit, increment}}
}

let streamURL = async (headers, url, body) =>
{
	let method = "GET"
	if (body) method = "POST", headers = {"content-type": "text/json", ...headers}
	let response = await fetch(url, {method, headers, body})
	if (!response.ok) console.log(response)
	if (!response.ok) return
	return ndjson(response.body)
}

let decoder = new TextDecoder()
let ndjson = browserStream => splitBrowserStream(browserStream, [0x0A]).map(bytes => decoder.decode(bytes)).filter(Boolean).map(json => JSON.parse(json))
