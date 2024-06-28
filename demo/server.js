import express from "express"

const app = express()

app.use(express.static(path.resolve(import.meta.dirname, "../pub")))

const port = 3000

app.listen(port)

console.log(`listening on port ${port}`)
