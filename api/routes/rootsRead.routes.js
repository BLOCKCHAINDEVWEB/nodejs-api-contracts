import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { ethers } from 'ethers'
import config from '../../config'
import KoRoot6 from '../artifacts6/KoMintableERC721.json'
import KoRoot7 from '../artifacts7/KoMintableERC721.json'
import { estimateFeeGas } from '../controllers/nftsController'

const router = express.Router()
dotenv.config({ path: path.join(__dirname, '../../.env') })

// goerli node url
const ethereumProvider = config.root.RPC
const providerParent = new ethers.providers.JsonRpcProvider(ethereumProvider)

router.post('/ownerOf', async (req, res) => {
  try {
    const { from, rootToken, tokenId } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, providerParent)

    const ownerOf = await rootContract.ownerOf(tokenId)
    console.log(ownerOf)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/tokenOwnerByIndex', async (req, res) => {
  try {
    const { from, rootToken, index } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, providerParent)

    const tx = await rootContract.tokenOfOwnerByIndex(from, index)
    const indexTx = Number(tx)
    console.log('tokenOwnerByIndex:', indexTx)

    res.status(200).json({ status: 'success', index: indexTx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/events', async (req, res) => {
  try {
    const { from, rootToken, tokenId } = req.body
    const approvalAbi = ["event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"]
    const contract = new ethers.Contract(rootToken, approvalAbi, providerParent)
    // console.log(contract.filters.Approval(from, from, 5))

    let filter 
    filter = contract.filters.Approval()
    filter.fromBlock = await providerParent.getBlockNumber()
    filter.toBlock = 'latest'

    const result = await providerParent.getLogs(filter)
    console.log(result)

    // const logs = await providerParent.getLogs({
    //   fromBlock: 5341795,
    //   toBlock: 'latest',
    //   topics: contract.filters.Approval(from).topics
    // })
    // console.log(logs)

    // const events = rootContract.getPastEvents('allEvents', {
    //   fromBlock: 5341795,
    //   toBlock: 'latest'
    // })
    // console.log(events)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/balance', async (req, res) => {
  try {
    const { from, rootToken } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, providerParent)
    const balanceOf = Number(await rootContract.balanceOf(from))

    res.status(200).json({ status: 'success', balanceOf: balanceOf })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/totalSupply', async (req, res) => {
  try {
    const { rootToken } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, providerParent)
    const totalSupply = Number(await rootContract.totalSupply())

    res.status(200).json({ status: 'success', totalSupply: totalSupply })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/isApprovalAll', async (req, res) => {
  try {
    const { rootToken, owner, operator } = req.body
    const rootContract = new ethers.Contract(rootToken, KoChild6.abi, providerParent)
    const isApproval = await rootContract.isApprovedForAll(owner, operator)

    res.status(200).json({ status: 'success', isApproval: isApproval })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
