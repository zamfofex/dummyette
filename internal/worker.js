import {traverse} from "./analysis.js"
import {toBoard} from "../notation/from-fen.js"
import {variant} from "../variants/checkless-chess.js"

addEventListener("message", ({data: [move, fen, depth]}) => postMessage({move, score: traverse(toBoard(fen, variant).MutableBoard(), depth)}))

postMessage("ready")
