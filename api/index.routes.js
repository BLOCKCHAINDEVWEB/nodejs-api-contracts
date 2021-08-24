import express from 'express'
import childsRead from './routes/childsRead.routes'
import childsWrite from './routes/childsWrite.routes'
import rootsWrite from './routes/rootsWrite.routes'
import rootsRead from './routes/rootsRead.routes'
import rootsChain from './routes/rootsChain.routes'

const router = express.Router()

router.use('/child', childsRead)
router.use('/child', childsWrite)
router.use('/root', rootsWrite)
router.use('/root', rootsRead)
router.use('/chain', rootsChain)

export default router
