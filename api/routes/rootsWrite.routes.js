import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { ethers } from 'ethers'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'
import getMaticPOSClient from '../services/matic'
import config from '../../config'
import KoRoot6 from '../artifacts6/KoMintableERC721.json'
import KoRoot7 from '../artifacts7/KoMintableERC721.json'
import { chainId, estimateFeeGas } from '../controllers/nftsController'


const router = express.Router()
const abiCoder = new ethers.utils.AbiCoder()
const { chainMainet } = chainId
const maticPOSClient = getMaticPOSClient()
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
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, signerParent)

    const resp = await rootContract.grantRole(role, predicate, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('grant Role tx: ', resp)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/mint', async (req, res) => {
  try {
    const { from, rootToken, metadataCid } = req.body
    const abi = ['function mint(address recipient, string memory uri)']
    const rootContract = new ethers.Contract(rootToken, abi, signerParent)

    // const ipfsMetadata = await axios.get(`https://ipfs.io/ipfs/${metadataCid}`)
    // const URI = `ipfs://${ipfsMetadata.data}`
    const URI = 'ipfs://QmZeYychcKrodnKo72JeSNdimeJ6AukrSNaPmsT2NpzdWE'

    const respMint = await rootContract.mint(from, URI, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('mint txHash:', respMint.hash)

    res.status(200).json({ status: 'success', txHash: respMint.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// approve before executeMetadata
router.post('/execMetadata', async (req, res) => {
  try {
    const { from, to, nftAddress, tokenId } = req.body
    const rootContract = new ethers.Contract(nftAddress , KoRoot7.abi , signerParent)

    const nonce = await rootContract.getNonce(from)
    console.log('nonce: ', parseInt(nonce))
    // console.log(await providerRoot.getBlockNumber())
    // console.log(await providerRoot.getTransactionCount(nftAddress))

    const transferFunctionAbi = ["function transferFrom(address from, address to, uint256 tokenId) external"]
    const iTransferFunction = new ethers.utils.Interface(transferFunctionAbi)
    const functionSignature = iTransferFunction.encodeFunctionData("transferFrom", [from, to, tokenId])

    // console.log(ethers.utils.defaultAbiCoder.decode(['address','address','uint256'], ethers.utils.hexDataSlice(fctSign, 4)))

    const domainType = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32"}
    ]
    const metaTransactionType = [
       { name: "nonce", type: "uint256" },
       { name: "from", type: "address" },
       { name: "functionSignature", type: "bytes" }
    ]
    const domainData = {
      name: "Ko Digital Collectible",
      version: "1",
      verifyingContract: nftAddress,
      salt: '0x'.concat(chainMainet.toString(16).padStart(64, '0'))
    }
  
    const msgParams = {
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: {
        nonce: parseInt(nonce),
        from: from,
        functionSignature: functionSignature
      }
    }
    const privateKeyBuffer = Buffer.from(privateKey, "hex")
  
    const sig = sigUtil.signTypedData_v4(
      privateKeyBuffer,
      {data: msgParams}
    )

    const { r, s, v } = ethUtil.fromRpcSig(sig)

    const sigR = '0x'.concat(r.toString('hex'))
    const sigS = '0x'.concat(s.toString('hex'))
    const sigV = v

    const tx = await rootContract.executeMetaTransaction(from, functionSignature, sigR, sigS, sigV, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('executeMetadata txHash:', tx.hash)

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/approve', async (req, res) => {
  try {
    const { from, rootToken, to, tokenId } = req.body
    const rootContract = new ethers.Contract(rootToken, KoRoot7.abi, signerParent)

    const tx = await rootContract.approve(to, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('approve', tx)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/approveWithMatic', async (req, res) => {
  try {
    const { from, rootToken, tokenId } = req.body
    const tx = await maticPOSClient.approveERC721ForDeposit(rootToken, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('approve txHash:', tx.transactionHash)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/approvalAll', async (req, res) => {
  try {
    const { from, operator, approved } = req.body
    const rootContract = new ethers.Contract(operator , KoRoot7.abi , signerParent)

    const approve = await rootContract.setApprovalForAll(operator, approved, {
      from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('approveAll tx:', approve)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// FAIL: method deposit non reconnue
router.post('/deposit', async (req, res) => {
  try {
    const { user, rootToken, tokenId } = req.body
    const abi = ['function deposit(address user, address rootToken, bytes calldata depositData)']
    const rootContract = new ethers.Contract(rootToken, abi, signerParent)

    const depositData = abiCoder.encode(['uint256'], [tokenId])

    const tx = await rootContract.deposit(user, rootToken, tokenId, {
      from: user,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/depositWithMatic', async (req, res) => {
  try {
    const { from, rootToken, tokenId } = req.body

    const tx = await maticPOSClient.depositERC721ForUser(rootToken, from, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log(tx)

    res.status(200).json({ status: 'success' })
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
