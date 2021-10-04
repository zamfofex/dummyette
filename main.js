import {Lichess} from "./lichess.js"
import {analyse} from "./dummyette.js"

let endArgs = () =>
{
	if (args.length !== 0)
	{
		console.error("Too many arguments were supplied.")
		Deno.exit(1)
	}
}

let play = async game =>
{
	let color = game.color
	if (color === null)
		console.error("The game could not be played because the bot is not partaking in it."),
		Deno.exit(1)
	
	for await (let board of game.boards.slice(game.boards.length - 1))
	{
		if (board.turn !== color) continue
		let moves = analyse(board)
		if (moves.length === 0) break
		
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

let token

let args = Deno.args.slice()

let action = args.shift()

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

let lichess = await Lichess(token)
if (!lichess)
{
	console.error("Could not connect to lichess.")
	if (!token) console.error("Did you set up your token correctly?")
	Deno.exit(1)
}

if (action === "start")
{
	let level = args.shift()
	endArgs()
	
	if (level === undefined) level = "1"
	
	if (!"12345678".split("").includes(level))
		console.error("Invalid Stockfish level."),
		Deno.exit(1)
	
	console.log("Starting a game against Stockfish...")
	
	let game = await lichess.StockfishGame(level, "black")
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
	endArgs()
	
	let games = await lichess.getGames()
	if (games.length !== 0)
	{
		console.log("Continuing ongoing games...")
		for (let game of games)
			console.log(`> https://lichess.org/${game.id}/black`),
			play(game)
		console.log("")
	}
	
	console.log("Starting games against Stockfish...")
	
	; (async () =>
	{
		while (true)
		{
			let game = await lichess.StockfishGame(1, "black")
			if (game)
				console.log("Started a game against Stockfish!"),
				console.log(`> https://lichess.org/${game.id}/black`)
			else
				console.error("A game against Stockfish could not be started."),
				Deno.exit(1)
			await play(game)
		}
	})().catch(() => Deno.exit(-1))
	
	console.log("Waiting for challenges...")
	
	for await (let {id, rated, color, variant, timeControl, accept, decline} of lichess.challenges)
	{
		console.log("")
		
		if (rated)
		{
			console.log(`Declining rated challenge: ${id}.`)
			await decline("casual")
			continue
		}
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
	else console.error("You need to specify an action: 'wait', 'start', 'continue', 'resign', 'idle'")
	Deno.exit(1)
}

Deno.exit()
