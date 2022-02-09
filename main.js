import {Lichess} from "./lichess.js"
import {AsyncAnalyser, analyse} from "./dummyette.js"
import {OpeningBook} from "./openings.js"

let endArgs = () =>
{
	if (args.length !== 0)
	{
		console.error("Too many arguments were supplied.")
		Deno.exit(1)
	}
}

let rest = time => new Promise(resolve => setTimeout(resolve, time))

let play = async (game, time = 0) =>
{
	let analyser = Analyser()
	
	let color = game.color
	if (color === null)
		console.error("The game could not be played because the bot is not partaking in it."),
		Deno.exit(1)
	
	if (game.finished)
	{
		console.warn("The game could not be played because it is already finished.")
		console.log(`< https://lichess.org/${game.id}/black`)
		return
	}
	
	let t0 = performance.now()
	
	if (openings)
	{
		for await (let board of game.boards.slice(game.boards.length - 1))
		{
			if (board.turn !== color) continue
			
			let moves = openings.lookup(board)
			if (moves.length === 0) break
			
			moves = moves.map(({name, weight}) => ({name, weight: Math.random() ** (1 / weight)}))
			moves.sort((a, b) => b.weight - a.weight)
			
			let t = performance.now()
			if (t - t0 < time) await rest(time - t + t0)
			t0 = performance.now()
			
			if (!await game.play(moves[0].name))
			{
				console.error(`Opening move ${moves[0].name} was not played successfully.`)
				await game.resign()
				break
			}
		}
	}
	
	for await (let board of game.boards.slice(game.boards.length - 1))
	{
		if (board.turn !== color) continue
		let moves = await analyser.analyse(board)
		if (moves.length === 0) break
		
		let t = performance.now()
		if (t - t0 < time) await rest(time - t + t0)
		t0 = performance.now()
		
		if (!await game.play(moves[0].name))
		{
			console.error(`Move ${moves[0].name} was not played successfully.`)
			await game.resign()
			break
		}
	}
	
	console.log("Game completed.")
	console.log(`< https://lichess.org/${game.id}/black`)
}

let args = Deno.args.slice()
let action = args.shift()

let Analyser = () => ({analyse})

if (action === "async")
{
	let options = {}
	if (/^[0-9]+$/.test(args[0]))
		options.workers = Number(args.shift())
	Analyser = () => AsyncAnalyser(options)
	
	action = args.shift()
}

let token

if (action === "token")
{
	let means = args.shift()
	if (means === undefined)
		console.error("Unterminated 'token' specification."),
		Deno.exit(1)
	
	if (means === "env")
	{
		let envName = args.shift()
		
		if (envName === undefined)
			console.error("No environment variable name provided for the token."),
			Deno.exit(1)
		
		token = Deno.env.get(envName)
	}
	else if (means === "given")
	{
		token = args.shift()
		if (token === undefined)
			console.error("No given token provided."),
			Deno.exit(1)
	}
	else if (means === "prompt")
	{
		token = prompt("Specify your lichess bot account token:", "")
	}
	
	action = args.shift()
}
else
{
	token = Deno.env.get("lichess_token")
}

let openings

if (action === "openings")
{
	let path = args.shift()
	if (path === undefined)
		console.error("No given opening book path."),
		Deno.exit(1)
	
	openings = OpeningBook(await Deno.readFile(path))
	
	action = args.shift()
}

let lichess = await Lichess(token)
if (!lichess)
{
	console.error("Could not connect to lichess.")
	if (!token) console.error("Did you set up your token correctly?")
	Deno.exit(1)
}

let stockfishLevels = "12345678".split("")

let parseOpponent = opponent =>
{
	let [{}, rated, name, time] = opponent.match(/^(\+)?(.*?)(?::(.*))?$/)
	if (!name) name = "1"
	rated = Boolean(rated)
	
	if (stockfishLevels.includes(name))
		return () => lichess.StockfishGame(name, "black")
	else
		return () => lichess.challenge(name, {rated, time, color: "black"})
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
		console.log(`> https://lichess.org/${game.id}/black`)
	else
		console.error("The game could not be started."),
		Deno.exit(1)
	
	await play(game)
}
else if (action === "continue")
{
	let id = args.shift()
	endArgs()
	
	if (id === undefined)
		console.error("The game id is missing."),
		console.error("Specify a game id for the bot to continue playing it."),
		Deno.exit(1)
	
	console.log("Continuing game...")
	let game = await lichess.getGame(id)
	if (!game)
		console.error("The game could not be continued."),
		console.error("Is the game id you provided correct?"),
		Deno.exit(1)
	
	lichess.declineChallenges("later")
	
	console.log("The game is continuing!")
	console.log(`> https://lichess.org/${id}/black`)
	
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
	if (games.length !== 0)
	{
		console.log("Continuing ongoing games...")
		for (let game of games)
			console.log("The game is continuing!"),
			console.log(`> https://lichess.org/${game.id}/black`),
			play(game)
	}
	
	; (async () =>
	{
		if (!opponents) return
		
		await Promise.all(games.map(({history}) => history.last))
		
		console.log("Starting games...")
		while (true)
		{
			let opponent = opponents[Math.floor(Math.random() * opponents.length)]
			
			let game = await opponent.start()
			if (game)
				console.log("Started a game!"),
				console.log(`> https://lichess.org/${game.id}/black`)
			else
				console.error(`A game '${opponent.name}' could not be started.`),
				Deno.exit(1)
			await play(game, 15000)
		}
	})()
	
	console.log("Waiting for challenges...")
	
	for await (let {id, color, variant, timeControl, accept, decline} of lichess.challenges)
	{
		console.log("")
		
		if (color !== "white")
		{
			console.log(`Declining miscolored challenge: ${id}.`)
			await decline("later")
			continue
		}
		if (variant !== "standard")
		{
			console.log(`Declining variant challenge: ${id}.`)
			await decline("standard")
			continue
		}
		if (timeControl !== "unlimited")
		{
			console.log(`Declining timed challenge: ${id}.`)
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
		console.log(`> https://lichess.org/${id}/black`)
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
		Deno.exit(1)
	
	let game = await lichess.getGame(id)
	if (!game)
		console.error("The game could not be resigned."),
		console.error("Is the game id you provided correct?"),
		Deno.exit(1)
	
	if (!await game.resign())
		console.error("The game could not be resigned."),
		Deno.exit(1)
	
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
	Deno.exit(1)
}

Deno.exit()
