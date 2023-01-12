import {traverse} from "./analysis.js"

postMessage("ready")

addEventListener("message", ({data: [move, board, depth]}) => postMessage({move, score: traverse(board, depth)}))
