import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { ethers } from 'ethers'
import config from '../../config'
import KoRoot6 from '../artifacts6/KoMintableERC721.json'
import { estimateFeeGas } from '../controllers/nftsController'


const router = express.Router()
const abiCoder = new ethers.utils.AbiCoder()
dotenv.config({ path: path.join(__dirname, '../../.env') })

// goerli node url
const ERC721Predicate = config.root.posERC721Predicate  // ERC721PredicateProxy
const ethereumProvider = config.root.RPC
const providerParent = new ethers.providers.JsonRpcProvider(ethereumProvider)

// Create a wallet instance
const privateKey = process.env.PRIVATE_KEY
const signerParent = new ethers.Wallet(privateKey, providerParent)

router.post('/grantRole', async (req, res) => {
  try {
    const { from, rootToken, predicate, role } = req.body  // bytes32 & PREDICATE_ROLE
    const rootContract = new ethers.Contract(rootToken, KoRoot6.abi, signerParent)

    const resp = await rootContract.grantRole(role, predicate, {
      from: from,
    })
    console.log(resp)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/approve', async (req, res) => {
  try {
    const { from, rootToken, to, tokenId } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot6.abi, signerParent)

    const depositData = abiCoder.encode(['uint256'], [tokenId])

    const tx = await rootContract.approve(ERC721Predicate, depositData, {
      from: from,
      gasPrice: gasPrice,
      gasLimit: gasLimit
    })
    console.log(tx)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/approvalAll', async (req, res) => {
  try {
    const { from, operator, approved } = req.body
    const rootContract = new ethers.Contract(operator , KoRoot6.abi , signerParent)

    const approve = await rootContract.setApprovalForAll(operator, approved, {
      from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0,005 GWEI limit
    })
    console.log(approve)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/deposit', async (req, res) => {
  try {
    const { userAddress, rootToken, tokenId } = req.body
    const abi = ['function deposit(address user, address rootToken, bytes calldata depositData) external']
    const rootContract = new ethers.Contract(rootToken, abi, signerParent)

    const depositData = abiCoder.encode(['uint256'], [tokenId])

    const tx = await rootContract.deposit(userAddress, rootToken, depositData, {
      from: userAddress,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0,005 GWEI limit
    })

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
