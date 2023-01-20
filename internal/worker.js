import {traverse} from "./analysis.js"
import {deserialize} from "./fast-chess.js"

addEventListener("message", ({data: [move, board, depth]}) => postMessage({move, score: traverse(deserialize(board), depth)}))

postMessage("ready")
