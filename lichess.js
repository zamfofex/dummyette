/// <reference path="./types/lichess.d.ts" />
/// <reference types="./types/lichess.d.ts" />

import {Color, standardBoard, other, King, Rook} from "./chess.js"
import {RewindJoinStream} from "./streams.js"
import {splitBrowserStream} from "./streams-browser.js"
import {fromFEN} from "./notation.js"

export let Lichess = async options =>
{
	if (typeof options === "string") options = {token: options}
	
	if (options === undefined) options = {}
	if (options === null) options = {}
	
	let {token, origin = "https://lichess.org"} = options
	
	try { origin = new URL(origin) }
	catch { return }
	if (!origin.pathname.endsWith("/"))
		origin.pathname += "/"
	origin = new URL(".", origin).href.slice(0, -1)
	
	token = String(token)
	let headers = {authorization: token}
	let args = {origin, headers}
	
	let response = await fetch(`${origin}/api/account`, {headers})
	if (!response.ok) return
	
	let info = await response.json()
	if (!info) return
	if (!info.id) return
	
	let username = info.id
	
	let events = await streamURL(headers, `${origin}/api/stream/event`)
	if (!events) return
	
	events.last.then(() =>
	{
		console.error("The Lichess event stream was broken, finalizing the process.")
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
		
		let response = await fetch(`${origin}/api/challenge/ai`, {method: "POST", headers, body: new URLSearchParams({level, color})})
		if (!response.ok) return
		
		let {id} = await response.json()
		return createGame(args, username, id)
	}
	
	let challenges = events
		.filter(event => event.type === "challenge")
		.map(event => event.challenge)
		.filter(challenge => challenge.challenger?.id !== username)
		.filter(challenge => validateChallenge(args, challenge))
		.map(challenge => createChallenge(args, username, events, challenge))
	
	let getGameIDs = async () =>
	{
		let response = await fetch(`${origin}/api/account/playing`, {headers})
		if (!response.ok) return
		let {nowPlaying} = await response.json()
		let ids = nowPlaying.map(({gameId}) => gameId)
		Object.freeze(ids)
		return ids
	}
	
	let getGames = async () =>
	{
		let ids = await getGameIDs()
		let promises = ids.map(id => createGame(args, username, id)).filter(Boolean)
		let games = await Promise.all(promises)
		Object.freeze(games)
		return games
	}
	
	let getGame = id =>
	{
		id = String(id)
		if (!/^[a-z0-9]{8}$/i.test(id)) return
		return createGame(args, username, id)
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
		
		let stream = await streamURL(headers, `${origin}/api/challenge/${otherUsername}`, JSON.stringify({...time, rated, color, keepAliveStream: true}))
		if (!stream) return
		
		let info = await stream.first
		if (!info) return
		if (!info.challenge) return
		let id = info.challenge.id
		
		let result = await stream.last
		if (!result) return
		if (result.done !== "accepted") return
		return createGame(args, username, id)
	}
	
	let getBotUsernames = async () =>
	{
		let usernames = []
		for await (let {username} of await streamURL(headers, `${origin}/api/bot/online`))
			usernames.push(username)
		Object.freeze(usernames)
		return usernames
	}
	
	let getUsernameGameIDs = async username =>
	{
		username = String(username)
		if (!/^[a-z0-9_]+$/i.test(username)) return
		
		let games = await streamURL(headers, `${origin}/api/games/user/${username}?ongoing=true`)
		if (!games) return
		
		let ids = []
		for await (let {id} of games)
			ids.push(id)
		Object.freeze(ids)
		return ids
	}
	
	let lichess =
	{
		origin,
		StockfishGame, challenges, username, getGame,
		getGames, getGameIDs,
		declineChallenges, acceptChallenges,
		challenge,
		getBotUsernames,
		getUsernameGameIDs,
	}
	Object.freeze(lichess)
	return lichess
}

let castling =
[
	["e1c1", "e1a1", "white", "e1", "a1"],
	["e1g1", "e1h1", "white", "e1", "h1"],
	["e8c8", "e8a8", "black", "e8", "a8"],
	["e8g8", "e8h8", "black", "e8", "h8"],
]

let createGame = async ({origin, headers}, username, id) =>
{
	let toLichessName = new Map()
	let fromLichessName = new Map()
	
	let gameEvents = await streamURL(headers, `${origin}/api/bot/game/stream/${id}`)
	if (!gameEvents) return
	gameEvents = RewindJoinStream(gameEvents)
	
	let resign = async () =>
	{
		let response = await fetch(`${origin}/api/bot/game/${id}/resign`, {method: "POST", headers})
		return response.ok
	}
	
	let n = 0
	let handle = async function * (names)
	{
		names = names.split(" ").slice(n)
		for (let name of names)
		{
			name = fromLichessName.get(name) ?? name
			
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
	
	let {white: {id: whiteUsername}, black: {id: blackUsername}, initialFen, rated} = full
	
	if (initialFen !== "startpos")
	{
		board = fromFEN(initialFen)
		if (!board)
		{
			await resign()
			console.error(`Unexpected starting position, finalizing process: ${initialFen}`)
			Deno.exit(-1)
		}
		
		for (let [name, lichessName, color, kingPosition, rookPosition] of castling)
		{
			if (board.at(kingPosition) !== King(color)) continue
			if (board.at(rookPosition) !== Rook(color)) continue
			if (board.get(kingPosition) !== "initial") continue
			if (board.get(rookPosition) !== "initial") continue
			
			toLichessName.set(name, lichessName)
			fromLichessName.set(lichessName, name)
		}
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
			name = toLichessName.get(name) ?? name
			let response = await fetch(`${origin}/api/bot/game/${id}/move/${name}`, {method: "POST", headers})
			if (!response.ok) break
			played++
		}
		return played
	}
	
	let color = null
	if (whiteUsername === username) color = "white"
	if (blackUsername === username) color = "black"
	
	let send = async message =>
	{
		let response = await fetch(`${origin}/api/bot/game/${id}/chat`, {method: "POST", headers, body: new URLSearchParams({room: "player", text: message})})
		return response.ok
	}
	
	let chat = {send}
	Object.freeze(chat)
	
	let game =
	{
		id,
		moveNames, moves: moveNames,
		history, boards, chat,
		play, resign,
		blackUsername, whiteUsername,
		color, rated,
		get board() { return board },
		get status() { return status },
		get turn() { return board.turn },
		get finished() { return status !== "ongoing" },
		get ongoing() { return status === "ongoing" },
	}
	
	Object.freeze(game)
	return game
}

let createChallenge = async (args, username, events, {id, rated, color, variant: {key: variant}, timeControl: {type: timeControl}, speed}) =>
{
	let {origin, headers} = args
	
	let accept = async () =>
	{
		let gamePromise = events.find(event => event.type === "gameStart" && event.game.id === id)
		
		let response = await fetch(`${origin}/api/challenge/${id}/accept`, {method: "POST", headers})
		if (!response.ok) return
		await gamePromise
		return createGame(args, username, id)
	}
	
	let decline = async reason =>
	{
		if (reason === undefined) reason = "generic"
		reason = String(reason)
		let response = await fetch(`${origin}/api/challenge/${id}/decline`, {method: "POST", headers, body: new URLSearchParams({reason})})
		return response.ok
	}
	
	let challenge = {id, variant, rated, timeControl, speed, accept, decline, color}
	Object.freeze(challenge)
	return challenge
}

let validateChallenge = ({origin, headers}, {id, variant}) =>
{
	if (variant.key !== "standard")
	if (variant.key !== "chess960")
	if (variant.key !== "fromPosition")
	{
		fetch(`${origin}/api/challenge/${id}/decline`, {method: "POST", headers, body: new URLSearchParams({reason: "standard"})})
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
	
	if (limit < 0) return
	if (increment < 0) return
	if (limit === 0 && increment === 0) return
	
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
	if (body) method = "POST", headers = {"content-type": "application/json", ...headers}
	let response = await fetch(url, {method, headers, body})
	if (!response.ok) return
	return ndjson(response.body)
}

let decoder = new TextDecoder()
let ndjson = browserStream => splitBrowserStream(browserStream, [0x0A]).map(bytes => decoder.decode(bytes)).filter(Boolean).map(json => JSON.parse(json))
