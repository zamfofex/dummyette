import {fromJSON} from "../fast-chess.js"
import {traverse} from "./analyse.js"

postMessage("ready")

addEventListener("message", ({data: [turn, move, json]}) =>
{
	let state = {move, total: 0, count: 0, chance: 0, win: 0, loss: 0, draw: 0}
	let moves = traverse(turn, fromJSON(json), state, 0)
	postMessage(state)
})
