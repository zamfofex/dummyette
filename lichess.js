/// <reference path="./types/lichess.d.ts" />
/// <reference types="./types/lichess.d.ts" />

import {Color, standardBoard, King, Rook, isCheckmate, isStalemate} from "./variants/chess.js"
import {RewindJoinStream} from "./streams.js"
import {splitBrowserStream} from "./streams-browser.js"
import {fromFEN, fromSAN, toUCI} from "./notation.js"

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
	
	events.last.then(() => { throw new Error("The Lichess event stream was broken.") })
	
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

let createGame = async ({origin, headers}, username, id) =>
{
	let gameEvents = await streamURL(headers, `${origin}/api/bot/game/stream/${id}`)
	if (!gameEvents) return
	gameEvents = RewindJoinStream(gameEvents)
	
	let resign = async () =>
	{
		let response = await fetch(`${origin}/api/bot/game/${id}/resign`, {method: "POST", headers})
		return response.ok
	}
	
	let game =
	{
		get board() { return board },
		get status() { return status },
		get turn() { return board.state.turn },
		get finished() { return status !== "ongoing" },
		get ongoing() { return status === "ongoing" },
		get whiteTime() { return getTime("white") },
		get blackTime() { return getTime("black") },
	}
	
	let n = 0
	let handle = async function * (names)
	{
		names = names.split(" ").slice(n)
		for (let name of names)
		{
			let turn = board.state.turn
			board = fromSAN(board, name)?.play()
			if (!board)
			{
				console.error(`Unexpected move in game: ${name}`)
				await resign()
				return
			}
			
			let result = {game, moveName: name, move: name, board, turn, moveNumber: Math.floor(n / 2)}
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
	
	let chess960 = false
	if (initialFen !== "startpos")
	{
		board = fromFEN(initialFen)
		if (!board)
		{
			console.error(`Unexpected starting position: ${initialFen}`)
			await resign()
			return
		}
	}
	
	let clock
	let time = performance.now()
	
	let history = RewindJoinStream([full.state], gameEvents)
		.filter(event => event.type === "gameState")
		.flatMap(event =>
		{
			if (clock)
			{
				time = performance.now()
				clock.white = event.wtime
				clock.black = event.btime
			}
			return [{moves: event.moves}, {done: !["created", "started"].includes(event.status)}]
		})
		.takeWhile(({done}) => !done)
		.map(({moves}) => moves)
		.filter(Boolean)
		.flatMap(moves => handle(moves))
	
	let moveNames = history.map(({moveName}) => moveName)
	let boards = RewindJoinStream([board], history.map(({board}) => board))
	
	boards.last.then(board =>
	{
		status = "aborted"
		if (isCheckmate(board)) status = "checkmate"
		if (isStalemate(board)) status = "draw"
	})
	
	if (full.state.moves) await boards.at(full.state.moves.split(" ").length)
	
	let color
	if (whiteUsername === username) color = "white"
	if (blackUsername === username) color = "black"
	
	let nextBoard = async () =>
	{
		if (game.finished) return
		return boards.slice(boards.length - 1).find(board => board.state.turn === color)
	}
	
	let play = async (...moves) =>
	{
		let played = 0
		for (let move of moves)
		{
			let board = await nextBoard()
			move = board.Move(move)
			if (!move) break
			let response = await fetch(`${origin}/api/bot/game/${id}/move/${toUCI(move, chess960)}`, {method: "POST", headers})
			if (!response.ok) break
			played++
		}
		return played
	}
	
	let send = async message =>
	{
		let response = await fetch(`${origin}/api/bot/game/${id}/chat`, {method: "POST", headers, body: new URLSearchParams({room: "player", text: message})})
		return response.ok
	}
	
	let chat = {send}
	Object.freeze(chat)
	
	if (full.clock) clock = {white: full.clock.initial, black: full.clock.initial}
	
	let getTime = color =>
	{
		if (!clock) return
		let t = clock[color]
		if (boards.length < 2) return t / 1000
		if (board.state.turn === color) t -= (performance.now() - time)
		return Math.max(0, t) / 1000
	}
	
	let handleBoards = async f =>
	{
		for await (let board of boards.slice(boards.length - 1))
		{
			if (isCheckmate(board)) return board
			if (board.state.turn !== color) continue
			await f(board)
		}
		
		return boards.last
	}
	
	Object.assign(game,
	{
		id, rated,
		moveNames, moves: moveNames,
		history, boards, chat,
		blackUsername, whiteUsername,
	})
	
	if (color) Object.assign(game, {play, resign, color, nextBoard, handleBoards})
	
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
