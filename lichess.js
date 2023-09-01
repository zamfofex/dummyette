/// <reference path="./types/lichess.d.ts" />
/// <reference types="./types/lichess.d.ts" />

import {Color, standardBoard, other, King, Rook, sameBoard} from "./chess.js"
import {RewindJoinStream} from "./streams.js"
import {splitBrowserStream} from "./streams-browser.js"
import {fromFEN, toUCI, fromSAN} from "./notation.js"

let registry = new FinalizationRegistry(f => f())

let FinalizationController = (...controllers) =>
{
	let abortController = new AbortController()
	
	let finished = false
	let n = 0
	
	let validate = () => { if (finished) throw new Error("trying to use finished finalization controller") }
	
	let register = (...objects) =>
	{
		validate()
		n += objects.length
		for (let object of objects) registry.register(object, terminate)
	}
	
	let extend = (...controllers) =>
	{
		validate()
		n += controllers.length
		for (let controller of controllers) controller.signal.addEventListener("abort", terminate)
	}
	
	let check = () =>
	{
		if (n > 0) return
		finished = true
		abortController.abort()
	}
	
	let terminate = () =>
	{
		n--
		check()
	}
	
	extend(...controllers)
	return {register, extend, get finished() { return finished }, signal: abortController.signal, check}
}

let handleAbort = error =>
{
	if (error instanceof DOMException)
	if (error.name === "AbortError")
		return
	throw error
}

let fetchJSON = async (...args) =>
{
	let response = await fetch(...args).catch(handleAbort)
	if (!response) return
	if (!response.ok) return
	return response.json().catch(handleAbort)
}

let fetchTry = async (...args) =>
{
	let response = await fetch(...args).catch(handleAbort)
	if (!response) return
	return response.ok
}

let fetchAny = async (...args) =>
{
	let response = await fetch(...args).catch(handleAbort)
	if (!response) return
	if (!response.ok) throw new Error("fetch failed: response not ok")
	response.arrayBuffer().catch(handleAbort)
}

let decoder = new TextDecoder()

let fetchStream = async (url, opts) =>
{
	if (opts)
	{
		let headers = opts.headers
		if (opts.body) opts = {...opts, headers: {...headers, "content-type": "application/json"}}
	}
	let response = await fetch(url, opts).catch(handleAbort)
	if (!response.ok) return
	return splitBrowserStream(response.body, [0x0A]).map(bytes => decoder.decode(bytes)).filter(Boolean).map(json => JSON.parse(json), handleAbort)
}

let Username = username =>
{
	username = String(username)
	username = username.toLowerCase()
	if (/[^a-z0-9_]/.test(username)) return
	if (username === "") return
	return username
}

let Origin = origin =>
{
	try { origin = new URL(origin) }
	catch { return }
	if (!origin.pathname.endsWith("/"))
		origin.pathname += "/"
	origin = new URL(".", origin).href.slice(0, -1)
	return origin
}

export let AnonymousLichess = (options = {}) =>
{
	if (typeof options === "string") options = {origin: options}
	let {origin = "https://lichess.org"} = options
	origin = Origin(origin)
	if (!origin) return
	return createLichess({origin})
}

export let Lichess = async (options = {}) =>
{
	if (typeof options === "string") options = {token: options}
	
	let {token, origin = "https://lichess.org"} = options
	
	origin = Origin(origin)
	if (!origin) return
	
	let controller = FinalizationController()
	
	token = String(token)
	let opts = {headers: {authorization: token}, signal: controller.signal}
	let args = {origin, opts}
	
	let info = await fetchJSON(`${origin}/api/account`, opts)
	if (!info) return
	if (!info.id) return
	
	let username = info.id
	
	let events = await fetchStream(`${origin}/api/stream/event`, opts)
	if (!events) return
	
	events.last.then(() => { if (!controller.finished) throw new Error("The Lichess event stream was broken.") })
	
	return createLichess(args, username, events, controller)
}

let createLichess = (args, username, events, controller) =>
{
	let {origin, opts} = args
	
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
		
		let info = await fetchJSON(`${origin}/api/challenge/ai`, {...opts, method: "POST", body: new URLSearchParams({level, color})})
		if (!info) return
		let {id} = info
		return createGame(args, username, id)
	}
	
	let getGameIDs = async () =>
	{
		let info = await fetchJSON(`${origin}/api/account/playing`, opts)
		if (!info) return
		let {nowPlaying} = info
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
		otherUsername = Username(otherUsername)
		if (!username) return
		
		rated = Boolean(rated)
		
		if (color !== "random") color = Color(color)
		if (!color) return
		
		if (typeof time === "string")
			time = parseTime(time)
		else
			time = normalizeTime(time)
		
		if (!time) return
		
		let stream = await fetchStream(`${origin}/api/challenge/${otherUsername}`, {...opts, method: "POST", body: JSON.stringify({...time, rated, color, keepAliveStream: true})})
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
		for await (let {username} of await fetchStream(`${origin}/api/bot/online`, opts))
			usernames.push(username)
		Object.freeze(usernames)
		return usernames
	}
	
	let getUsernameGameIDs = async username =>
	{
		username = Username(username)
		if (!username) return
		
		let games = await fetchStream(`${origin}/api/games/user/${username}?ongoing=true`, opts)
		if (!games) return
		
		let ids = []
		for await (let {id} of games)
			ids.push(id)
		Object.freeze(ids)
		return ids
	}
	
	let getUser = otherUsername => createUser(args, username, otherUsername)
	
	let getBots = async () =>
	{
		let users = []
		for (let username of await getBotUsernames())
			users.push(await getUser(username))
		Object.freeze(users)
		return users
	}
	
	let lichess =
	{
		origin,
		getGame,
		getBotUsernames,
		getUsernameGameIDs,
		getUser, getBots,
	}
	
	if (username)
	{
		let challenges = events
			.filter(event => event.type === "challenge")
			.map(event => event.challenge)
			.filter(challenge => challenge.challenger?.id !== username)
			.filter(challenge => validateChallenge(args, challenge))
			.map(challenge => createChallenge(args, username, events, challenge))
		
		Object.assign(lichess,
		{
			StockfishGame, challenges, username,
			getGames, getGameIDs,
			declineChallenges, acceptChallenges,
			challenge,
		})
		
		controller.register(challenges, declineChallenges, acceptChallenges)
	}
	
	Object.freeze(lichess)
	return lichess
}

export let lichess = AnonymousLichess()

let createGame = async ({origin, opts: {...opts}}, username, id) =>
{
	let controller = FinalizationController()
	opts.signal = controller.signal
	
	let gameEvents = await fetchStream(`${origin}/api/bot/game/stream/${id}`, opts)
	if (!gameEvents) return
	gameEvents = RewindJoinStream(gameEvents)
	
	let resign = () =>
	{
		fetchAny(`${origin}/api/bot/game/${id}/resign`, {...opts, method: "POST"})
		return Promise.resolve(true)
	}
	
	let n = 0
	let handle = async function * (names)
	{
		for (let name of names.split(" ").slice(n))
		{
			let turn = board.turn
			board = fromSAN(board, name)?.play()
			if (!board)
			{
				console.error(`Unexpected move in game: ${name}`)
				await resign()
				return
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
			console.error(`Unexpected starting position: ${initialFen}`)
			await resign()
			return
		}
	}
	
	let chess960 = initialFen !== "startpos"
	
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
		if (board.moves.length === 0)
			if (board.checkmate)
				status = "checkmate"
			else
				status = "draw"
		else
			status = "aborted"
	})
	
	if (full.state.moves) await boards.at(full.state.moves.split(" ").length)
	
	let play = async (...moves) =>
	{
		let played = 0
		for (let move of moves)
		{
			if (typeof move === "string")
			{
				move = fromSAN(board, move)
				if (!move) break
			}
			if (!sameBoard(move.before, board)) break
			let promise = history.at(history.length)
			let ok = await fetchTry(`${origin}/api/bot/game/${id}/move/${toUCI(move, chess960)}`, {...opts, method: "POST"})
			if (!ok) break
			await promise
			played++
		}
		return played
	}
	
	let color = null
	if (whiteUsername === username) color = "white"
	if (blackUsername === username) color = "black"
	
	let send = message => fetchTry(`${origin}/api/bot/game/${id}/chat`, {...opts, method: "POST", body: new URLSearchParams({room: "player", text: message})})
	
	let chat = {send}
	Object.freeze(chat)
	
	if (full.clock) clock = {white: full.clock.initial, black: full.clock.initial}
	
	let getTime = color =>
	{
		if (!clock) return
		let t = clock[color]
		if (boards.length < 2) return t / 1000
		if (board.turn === color) t -= (performance.now() - time)
		return Math.max(0, t) / 1000
	}
	
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
		get whiteTime() { return getTime("white") },
		get blackTime() { return getTime("black") },
	}
	
	controller.register(game, history[Symbol.asyncIterator], play, resign)
	
	Object.freeze(game)
	return game
}

let createChallenge = async (args, username, events, {id, rated, color, variant: {key: variant}, timeControl: {type: timeControl}, speed}) =>
{
	let {origin, opts} = args
	
	let accept = async () =>
	{
		let gamePromise = events.find(event => event.type === "gameStart" && event.game.id === id)
		
		let ok = await fetchTry(`${origin}/api/challenge/${id}/accept`, {...opts, method: "POST"})
		if (!ok) return
		await gamePromise
		return createGame(args, username, id)
	}
	
	let decline = async reason =>
	{
		if (reason === undefined) reason = "generic"
		reason = String(reason)
		return fetchTry(`${origin}/api/challenge/${id}/decline`, {...opts, method: "POST", body: new URLSearchParams({reason})})
	}
	
	let challenge = {id, variant, rated, timeControl, speed, accept, decline, color}
	Object.freeze(challenge)
	return challenge
}

let validateChallenge = ({origin, opts}, {id, variant}) =>
{
	if (variant.key !== "standard")
	if (variant.key !== "chess960")
	if (variant.key !== "fromPosition")
	{
		fetchAny(`${origin}/api/challenge/${id}/decline`, {...opts, method: "POST", body: new URLSearchParams({reason: "standard"})})
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

let variantRatingNames = [["chess960"], ["atomicChess", "atomic"], ["horde"], ["racingKings"], ["kingOfTheHill"]]
let ratingNames = [["correspondence"], ["classical"], ["rapid"], ["blitz"], ["bullet"], ["ultrabullet", "ultraBullet"]]

export let variantNames = ["chess", ...variantRatingNames.map(([key]) => key)]
export let timeControlTypes = ratingNames.map(([key]) => key)
Object.freeze(variantNames, timeControlTypes)

let setVariant = (variants, fs, info, [key, name = key]) =>
{
	let object
	Object.defineProperty(variants, key, {enumerable: true, get: () => object})
	let fn = info =>
	{
		let {perfs: {[name]: {games: count, rating, rd: deviation, prov: provisional = false} = {games: 0, rating: 1500, rd: Infinity, prov: true}} = {}} = info
		object = {count, rating, provisional, deviation}
		Object.freeze(object)
	}
	fn(info)
	fs.push(fn)
}

let createUpdate = (fs, origin, username) =>
{
	let setInfo = value => fs.deref()?.forEach(fn => fn(value))
	return async () => setInfo(await fetchJSON(`${origin}/api/user/${username}`, opts))
}

let createClearInterval = interval => () => clearInterval(interval)

let createUser = async (args, username, otherUsername) =>
{
	let {origin, opts} = args
	let controller = FinalizationController()
	if (opts) opts = {...opts, signal: controller.signal}
	
	otherUsername = Username(otherUsername)
	if (!otherUsername) return
	let info = await fetchJSON(`${origin}/api/user/${otherUsername}`, opts)
	if (!info) return
	if (info.disabled) return
	
	let getChessCount = () =>
	{
		let count = 0
		for (let [name] of ratingNames)
			count += variants.chess[ratingNames].count
		return count
	}
	
	let fs = []
	let variants = {chess: {get count() { return getChessCount() }}}
	
	for (let name of ratingNames)
		setVariant(variants.chess, fs, info, name)
	Object.freeze(variants.chess)
	
	for (let name of variantRatingNames)
		setVariant(variants, fs, info, name)
	Object.freeze(variants)
	
	let getGameIDs = async () =>
	{
		let games = await fetchStream(`${origin}/api/games/user/${otherUsername}?ongoing=true`, opts)
		if (!games) return
		
		let ids = []
		for await (let {id} of games)
			ids.push(id)
		Object.freeze(ids)
		return ids
	}
	
	let getGames = async () =>
	{
		let games = []
		for (let id of await getGameIDs())
			games.push(await createGame(args, username, id))
		Object.freeze(games)
		return games
	}
	
	let hours = 1
	let minutes = hours * 60
	let seconds = minutes * 60
	let milliseconds = minutes * 1000
	let interval = setInterval(createUpdate(new WeakRef(fs), origin, otherUsername), milliseconds)
	
	controller.register(variants, variants.chess, getGameIDs)
	controller.signal.addEventListener("abort", createClearInterval(interval))
	
	let user =
	{
		username: info.id,
		title: info.title,
		displayName: info.username,
		variants,
		violator: Boolean(info.tosViolation),
		getOngoingGameIDs() { return getGameIDs() },
		getOngoingGames() { return getGames() },
	}
	
	Object.freeze(user)
	return user
}
