import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { ethers } from 'ethers'
import getMaticPOSClient from '../services/matic'
import config from '../../config'
import { estimateFeeGas } from '../controllers/nftsController'

const router = express.Router()
const abiCoder = new ethers.utils.AbiCoder()
const maticPOSClient = getMaticPOSClient()
dotenv.config({ path: path.join(__dirname, '../../.env') })

// goerli node url
const ethereumProvider = config.root.RPC
const rootChainAddress = config.root.POSRootChainManager // RootChainManagerProxy
const providerParent = new ethers.providers.JsonRpcProvider(ethereumProvider)

// Create a wallet instance
const privateKey = process.env.PRIVATE_KEY
const signerParent = new ethers.Wallet(privateKey, providerParent)

router.post('/depositFor', async (req, res) => {
  try {
    const { userAddress, rootToken, tokenId } = req.body
    const abi = ['function depositFor(address user, address rootToken, bytes calldata depositData) external']
    const rootChainManager = new ethers.Contract(rootChainAddress, abi, signerParent)

    const depositData = abiCoder.encode(['uint256'], [tokenId])

    const tx = await rootChainManager.depositFor(userAddress, rootToken, depositData, {
      from: userAddress,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/exitsWithMatic', async (req, res) => {
  try {
    const { from, to, burnHash } = req.body

    const exitCalldata = await maticPOSClient.exitERC721(burnHash, {
      from: from,
      encodeAbi: true,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    await signerParent.sendTransaction({
      to: to, // rootChainManager
      data: exitCalldata.data,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })

    res.status(200).json({ status: 'success', txHash: exitCalldata.transactionHash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
