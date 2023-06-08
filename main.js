import {Lichess} from "./lichess.js"
import {AsyncAnalyser} from "./dummyette.js"
import * as messages from "./internal/flavoring.js"
import {toSAN} from "./notation.js"

let runtime

if (typeof Deno !== "undefined")
{
	runtime = Deno
}
else if (typeof Bun !== "undefined")
{
	let fsp = await import("fs/promises")
	runtime =
	{
		args: Bun.argv.slice(3),
		env: {get: name => Bun.env[name]},
		exit: process.exit,
		readFile: fsp.readFile,
	}
}
else if (typeof global !== "undefined")
{
	let process = await import("process")
	let fsp = await import("fs/promises")
	runtime =
	{
		args: process.argv.slice(2),
		env: {get: name => process.env[name]},
		exit: process.exit,
		readFile: fsp.readFile,
	}
	
	if (typeof fetch === "undefined")
		globalThis.fetch = (await import("node-fetch")).default
}
else
{
	throw new Error("Unsupported JavaScript runtime")
}

let {args, env, readFile, exit} = runtime
args = args.slice()

let endArgs = () =>
{
	if (args.length !== 0)
	{
		console.error("Too many arguments were supplied.")
		exit(1)
	}
}

let play = async game =>
{
	let chat = async messages =>
	{
		if (game.rated) return
		let messages2 = messages[Math.floor(Math.random() * messages.length)]
		await game.chat.send(messages2[Math.floor(Math.random() * messages2.length)])
	}
	
	let color = game.color
	if (!color)
		console.error("The game could not be played because the bot is not partaking in it."),
		exit(1)
	
	if (game.finished)
	{
		console.warn("The game could not be played because it is already finished.")
		console.log(`< ${lichess.origin}/${game.id}`)
		return
	}
	
	if (game.boards.length === 0) await chat(messages.start)
	
	let average = 0
	let messageIndex = 0
	let status
	
	for await (let board of game.boards.slice(game.boards.length - 1))
	{
		if (board.moves.length === 0)
		{
			if (board.checkmate)
			{
				if (board.turn === color)
					await chat(messages.lost)
				else
					await chat(messages.won)
			}
			
			break
		}
		
		if (board.turn !== color) continue
		
		let count = 0
		for (let y = 0 ; y < board.width ; y++)
		for (let x = 0 ; x < board.height ; x++)
			if (board.at(x, y)) count++
		
		let options = {}
		
		if (game.whiteTime !== undefined)
		{
			let min
			if (color === "white") min = game.whiteTime / 4
			if (color === "black") min = game.blackTime / 4
			
			let time = Math.log(min + 1) * 240 / count
			time = Math.min(time, 90)
			time = Math.max(time, Math.min(min * 0.75, 6))
			
			options.time = time
		}
		
		let evaluations = await analyser.evaluate(board, options)
		let {score, move} = evaluations[0]
		
		if (score < average && (messageIndex >= 6 || status === "winning"))
		{
			messageIndex = 0
			status = "losing"
			await chat(messages.losing)
		}
		if (score > average && (messageIndex >= 6 || status === "losing"))
		{
			messageIndex = 
			status = "winning"
			await chat(messages.winning)
		}
		messageIndex++
		
		if (Math.abs(score) < 900)
			average *= 2 / 3,
			average += score / 3
		
		if (!await game.play(move))
		{
			console.error(`Move ${toSAN(move)} was not played successfully.`)
			await game.resign()
			break
		}
	}
	
	console.log("Game completed.")
	console.log(`< ${lichess.origin}/${game.id}`)
}

let action = args.shift()

let analyserOptions = {}
if (action === "async")
{
	let workerCount = args.shift()
	if (workerCount === undefined)
		console.error("Unterminated 'async' specification."),
		exit(1)
	if (!/^[0-9]+$/.test(workerCount))
		console.error("The 'async' specifier must be given a positive integer."),
		exit(1)
	
	analyserOptions.workers = Number(workerCount)
	action = args.shift()
}

let analyser = AsyncAnalyser(analyserOptions)

let origin
if (action === "origin")
{
	origin = args.shift()
	if (origin === undefined)
		console.error("Unterminated 'origin' specification."),
		exit(1)
	action = args.shift()
}

let token
if (action !== "token")
{
	token = env.get("lichess_token")
}
else
{
	let means = args.shift()
	if (means === undefined)
		console.error("Unterminated 'token' specification."),
		exit(1)
	
	if (means === "env")
	{
		let envName = args.shift()
		
		if (envName === undefined)
			console.error("No environment variable name provided for the token."),
			exit(1)
		
		token = env.get(envName)
	}
	if (means === "given")
	{
		token = args.shift()
		if (token === undefined)
			console.error("No given token provided."),
			exit(1)
	}
	if (means === "prompt")
		token = prompt("Specify your Lichess bot account token:", "")
	
	action = args.shift()
}

let options = {token}
if (origin !== undefined) options.origin = origin

let lichess = await Lichess(options)
if (!lichess)
{
	console.error("Could not connect to Lichess.")
	if (!token) console.error("Did you set up your token correctly?")
	exit(1)
}

let stockfishLevels = "12345678".split("")

let parseOpponent = opponent =>
{
	let [{}, rated, name, color, time] = opponent.match(/^(\+)?(.*?)(?:\/(black|white|random))?(?::(.*))?$/)
	if (!name) name = "1"
	if (!color) color = "black"
	rated = Boolean(rated)
	
	if (stockfishLevels.includes(name))
		return () => lichess.StockfishGame(name, color)
	else
		return () => lichess.challenge(name, {rated, time, color})
}

if (action === "start")
{
	let name = args.shift()
	endArgs()
	
	if (name === undefined) name = "1"
	let start = parseOpponent(name)
	
	console.log("Starting a game...")
	
	let game = await start()
	if (game)
		console.log("The game has started!"),
		console.log(`> ${lichess.origin}/${game.id}`)
	else
		console.error("The game could not be started."),
		exit(1)
	
	await play(game)
}
else if (action === "continue")
{
	let id = args.shift()
	endArgs()
	
	if (id === undefined)
		console.error("The game id is missing."),
		console.error("Specify a game id for the bot to continue playing it."),
		exit(1)
	
	console.log("Continuing game...")
	let game = await lichess.getGame(id)
	if (!game)
		console.error("The game could not be continued."),
		console.error("Is the game id you provided correct?"),
		exit(1)
	
	lichess.declineChallenges("later")
	
	console.log("The game is continuing!")
	console.log(`> ${lichess.origin}/${id}`)
	
	await play(game)
}
else if (action === "wait")
{
	let opponents
	
	if (args[0] === "play")
	{
		args.shift()
		
		let names = args.splice(0, Infinity)
		if (names.length === 0) names.push("1")
		
		opponents = []
		for (let name of names)
			opponents.push({name, start: parseOpponent(name)})
	}
	
	endArgs()
	
	let games = await lichess.getGames()
	
	; (async () =>
	{
		if (games.length !== 0)
		{
			console.log("Continuing ongoing games...")
			for (let game of games)
				console.log("The game is continuing!"),
				console.log(`> ${lichess.origin}/${game.id}`),
				play(game)
		}
	})()
	
	; (async () =>
	{
		if (!opponents) return
		
		if (games.length > 8)
		{
			console.log("Too many ongoing games, waiting for their completion...")
			await Promise.all(games.map(game => game.history.last))
		}
		
		console.log("Starting games...")
		while (true)
		{
			let opponent = opponents[Math.floor(Math.random() * opponents.length)]
			
			let game = await opponent.start()
			if (game)
				console.log("Started a game!"),
				console.log(`> ${lichess.origin}/${game.id}`)
			else
				console.error(`A game '${opponent.name}' could not be started.`),
				exit(1)
			await play(game)
		}
	})()
	
	console.log("Waiting for challenges...")
	
	for await (let {id, color, variant, timeControl, speed, rated, accept, decline} of lichess.challenges)
	{
		console.log("")
		
		if (variant !== "standard")
		if (variant !== "chess960")
		if (variant !== "fromPosition")
		{
			console.log(`Declining variant challenge: ${id}.`)
			await decline("standard")
			continue
		}
		if (timeControl !== "clock")
		if (rated)
		{
			console.log(`Declining rated correspondence challenge: ${id}.`)
			await decline("tooSlow")
			continue
		}
		if (timeControl !== "unlimited")
		if (speed === "bullet")
		{
			console.log(`Declining bullet challenge: ${id}.`)
			await decline("tooFast")
			continue
		}
		
		console.log("Accepting challenge...")
		let game = await accept()
		if (!game)
		{
			console.error(`The challenge could not be accepted: ${id}`)
			continue
		}
		console.log("Challenge accepted!")
		console.log(`> ${lichess.origin}/${id}`)
		play(game)
	}
}
else if (action === "resign")
{
	let id = args.shift()
	endArgs()
	
	if (id === undefined)
		console.error("The game id is missing."),
		console.error("Specify a game id for the bot to resign."),
		exit(1)
	
	let game = await lichess.getGame(id)
	if (!game)
		console.error("The game could not be resigned."),
		console.error("Is the game id you provided correct?"),
		exit(1)
	
	if (!await game.resign())
		console.error("The game could not be resigned."),
		exit(1)
	
	console.log("The game was resigned succesfully.")
}
else if (action === "idle")
{
	endArgs()
	console.log("Idling...")
	lichess.declineChallenges("later")
	await new Promise(() => { })
}
else
{
	if (action) console.error(`Unknown action '${action}'.`)
	else console.error("You need to specify an action: 'wait', 'wait play', 'start', 'continue', 'resign', or 'idle'")
	exit(1)
}

exit()
