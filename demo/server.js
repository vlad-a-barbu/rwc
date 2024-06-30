import express from "express"
import path from "node:path"

const app = express()

app.use(express.static(path.resolve(import.meta.dirname, "../pub")))

const port = 3000

app.listen(port)

console.log(`listening on port ${port}`)
