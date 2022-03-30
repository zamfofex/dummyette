import {traverse} from "./analysis.js"

postMessage("ready")

addEventListener("message", ({data: [move, board]}) => postMessage({move, score: traverse(board)}))
