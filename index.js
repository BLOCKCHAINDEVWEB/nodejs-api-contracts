import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import routes from './api/index.routes'

dotenv.config({ path: path.join(__dirname, './.env') })

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res, next)=>{
  res.status(404).json({name: 'API', version: '1.0', status: 404, message: 'not_found'})
})

app.use('/api', routes)

// if (process.env.NODE_ENV === 'developement') {
  const PORT = process.env.PORT || 8080
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
  })
// }

// export default app
