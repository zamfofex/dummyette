import {traverse} from "./analysis.js"
import {deserialise} from "./fast-chess.js"

addEventListener("message", ({data: [move, board, node]}) => postMessage({...traverse(deserialise(board), node), move}))

postMessage("ready")
