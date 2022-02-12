import {fromJSON} from "../fast-chess.js"
import {traverse} from "./analysis.js"

postMessage("ready")

addEventListener("message", ({data: [turn, move, depth, json]}) => postMessage({move, score: traverse(turn, fromJSON(json), depth)}))
