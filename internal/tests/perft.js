import {standardBoard} from "../../variants/chess.js"
import {fromFEN} from "../../notation.js"

let perft = (n, board) =>
{
	if (n === 0) return 1
	
	let count = 0
	for (let move of board.moves)
		count += perft(n - 1, move.play())
	return count
}

let expectations =
[
	["Initial Position", standardBoard, 1, 20, 400, 8902, 197281, 4865609, 119060324, 3195901860, 84998978956, 2439530234167],
	["Position 2", fromFEN("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -"), 1, 48, 2039, 97862, 4085603, 193690690, 8031647685],
	["Position 3", fromFEN("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -"), 1, 14, 191, 2812, 43238, 674624, 11030083, 178633661, 3009794393],
	["Position 4 (1)", fromFEN("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"), 1, 6, 264, 9467, 422333, 15833292, 706045033],
	["Position 4 (2)", fromFEN("r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1"), 1, 6, 264, 9467, 422333, 15833292, 706045033],
	["Position 5", fromFEN("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"), 1, 44, 1486, 62379, 2103487, 89941194],
	["Position 6", fromFEN("r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"), 1, 46, 2079, 89890, 3894594, 164075551, 6923051137, 287188994746, 11923589843526, 490154852788714],
]

// from: <https://gist.github.com/peterellisjones/8c46c28141c162d1d8a0f0badbc9cff9>
let extra =
[
	["r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2", 1, 8],
	["8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3", 1, 8],
	["r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2", 1, 19],
	["r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2", 1, 5],
	["2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2", 1, 44],
	["rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9", 1, 39],
	["2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4", 1, 9],
	["rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", 3, 62379],
	["r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10", 3, 89890],
	["3k4/3p4/8/K1P4r/8/8/8/8 b - - 0 1", 6, 1134888],
	["8/8/4k3/8/2p5/8/B2P2K1/8 w - - 0 1", 6, 1015133],
	["8/8/1k6/2b5/2pP4/8/5K2/8 b - d3 0 1", 6, 1440467],
	["5k2/8/8/8/8/8/8/4K2R w K - 0 1", 6, 661072],
	["3k4/8/8/8/8/8/8/R3K3 w Q - 0 1", 6, 803711],
	["r3k2r/1b4bq/8/8/8/8/7B/R3K2R w KQkq - 0 1", 4, 1274206],
	["r3k2r/8/3Q4/8/8/5q2/8/R3K2R b KQkq - 0 1", 4, 1720476],
	["2K2r2/4P3/8/8/8/8/8/3k4 w - - 0 1", 6, 3821001],
	["8/8/1P2K3/8/2n5/1q6/8/5k2 b - - 0 1", 5, 1004658],
	["4k3/1P6/8/8/8/8/K7/8 w - - 0 1", 6, 217342],
	["8/P1k5/K7/8/8/8/8/8 w - - 0 1", 6, 92683],
	["K1k5/8/P7/8/8/8/8/8 w - - 0 1", 6, 2217],
	["8/k1P5/8/1K6/8/8/8/8 w - - 0 1", 7, 567584],
	["8/8/2k5/5q2/5n2/8/5K2/8 b - - 0 1", 4, 23527],
]

let max = 50000
if (/^[0-9]+$/.test(Deno.args[0]))
	max = Number(Deno.args[0])

for (let [name, board, ...counts] of expectations)
{
	Deno.test(name, async test =>
	{
		for (let [n, count] of counts.entries())
		{
			await test.step(
			{
				name: `Ply ${n}: ${count}`,
				ignore: count > max,
				fn: () =>
				{
					let count2 = perft(n, board)
					if (count2 !== count) throw new Error(`wrong count: ${count2}`)
				},
			})
		}
	})
}

for (let [i, [fen, n, count]] of extra.entries())
{
	Deno.test(
	{
		name: `Extra position ${i + 1}, ply ${n}: ${count}`,
		ignore: count > max,
		fn: () =>
		{
			let count2 = perft(n, fromFEN(fen))
			if (count2 !== count) throw new Error(`wrong count: ${count2}`)
		},
	})
}
