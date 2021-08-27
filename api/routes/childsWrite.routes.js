import dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { ethers } from 'ethers'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'
import getMaticPOSClient from '../services/matic'
import KoChild6 from '../artifacts6/tokenNFT.json'
import KoChild7 from '../artifacts7/tokenNFT.json'
import { chainId, token, estimateFeeGas, nftContractIsDeploy, getTxDataTransfer } from '../controllers/nftsController'
import config from '../../config'

dotenv.config({ path: path.resolve(__dirname, '../.env') })
const router = express.Router()
const { name, version } = token
const { chainMumbai } = chainId
const abiCoder = new ethers.utils.AbiCoder()
const maticPOSClient = getMaticPOSClient()
const ERC721Predicate = config.root.posERC721Predicate  // ERC721PredicateProxy

// polygon node url
const maticProvider = config.child.RPC
const providerChild = new ethers.providers.JsonRpcProvider(maticProvider)

// Create a wallet instance
const privateKey = process.env.PRIVATE_KEY
const signerChild = new ethers.Wallet(privateKey, providerChild)

router.post('/mint', async (req, res) => {
  try {
    const { from, metadataCid, nftAddress } = req.body
    const childContract = new ethers.Contract(nftAddress , KoChild7.abi , signerChild)

    // const ipfsMetadata = await axios.get(`https://ipfs.io/ipfs/${metadataCid}`)
    // const URI = `ipfs://${ipfsMetadata.data}`
    const URI = 'ipfs://QmZeYychcKrodnKo72JeSNdimeJ6AukrSNaPmsT2NpzdWE'

    const respMint = await childContract.mintable(from, URI, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('mint txHash:', respMint.hash)
    const txMint = await respMint.wait()
    const tokenId = txMint.events[0].args[2].toNumber()
    console.log('tokenId:', tokenId)

    res.status(200).json({ status: 'success', txHash: respMint.hash, tokenId: tokenId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/mintFactory', async (req, res) => {
  try {
    const { from, name, symbol, metadataCid } = req.body
    //Only for tokenNFT with contructor
    // const { contractAddress } = await nftContractIsDeploy(name, symbol)
    const contractAddress = '0x4A6f2FC2006616542305e39AbAFE8C27385e8B3c'
    console.log('contractAddress:', contractAddress)

    const childContract = new ethers.Contract(contractAddress , KoChild7.abi , signerChild)

    // const ipfsMetadata = await axios.get(`https://ipfs.io/ipfs/${metadataCid}`)
    // const URI = `ipfs://${ipfsMetadata.data}`
    const URI = 'ipfs://QmZeYychcKrodnKo72JeSNdimeJ6AukrSNaPmsT2NpzdWE'
    
    const respMint = await childContract.mintable(from, URI, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })

    const txMint = await respMint.wait()
    const tokenId = txMint.events[0].args[2].toNumber()
    console.log('tokenId: ', tokenId)

    res.status(200).json({ status: 'success', txHash: respMint.hash, tokenId: tokenId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// approve before executeMetadata
router.post('/execMetadata', async (req, res) => {
  try {
    const { from, to, nftAddress, tokenId } = req.body
    const childContract = new ethers.Contract(nftAddress , KoChild7.abi , signerChild)

    const nonce = await childContract.getNonce(from)
    console.log('nonce: ', parseInt(nonce))
    // console.log(await providerChild.getBlockNumber())
    // console.log(await providerChild.getTransactionCount(nftAddress))

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
      salt: '0x'.concat(chainMumbai.toString(16).padStart(64, '0'))
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

    const tx = await childContract.executeMetaTransaction(from, functionSignature, sigR, sigS, sigV, {
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
    const { owner, nftAddress, to, tokenId } = req.body
    const childContract = new ethers.Contract(nftAddress, KoChild7.abi, signerChild)

    const tx = await childContract.approve(to, tokenId, {
      from: owner,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('approve txHash:', tx.hash)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// FAIL: approve caller is not owner
router.post('/approvalAll', async (req, res) => {
  try {
    const { from, operator, approved } = req.body
    const childContract = new ethers.Contract(operator , KoChild7.abi , signerChild)

    const approve = await childContract.setApprovalForAll(operator, approved, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('approvalAll\'s response tx:', approve)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/transferFrom', async (req, res) => {
  try {
    const { from, to, nftAddress, tokenId } = req.body
    const childContract = new ethers.Contract(nftAddress , KoChild7.abi , signerChild)
    
    const tx = await childContract.transferFrom(from, to, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('NFT transferred:', tx.hash)
    console.log('Tx nonce:', tx.nonce)

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// FAIL: approve caller is not owner
router.post('/safeTransferFrom', async (req, res) => {
  try {
    const { from, to, nftAddress, tokenId } = req.body
    const childContract = new ethers.Contract(nftAddress , KoChild7.abi , signerChild)

    const tx = await childContract["safeTransferFrom(address,address,uint256)"](from, to, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('safeTransferFrom\'s response tx: ', tx.hash)

    res.status(200).json({ status: 'success', txHash: tx.hash  })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// FAIL: INSUFFICIENT_PERMISSIONS
router.post('/deposit', async (req, res) => {
  try {
    const { user, nftAddress, rootToken, tokenId } = req.body
    const abi = ['function deposit(address user, bytes calldata depositData) external']
    const childContract = new ethers.Contract(nftAddress, abi, signerChild)

    const depositData = abiCoder.encode(['uint256'], [tokenId])

    const tx = await childContract.deposit(rootToken, depositData, {
      from: user,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('deposit\'s response tx: ', tx.hash)

    res.status(200).json({ status: 'success', txHash: tx.hash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// need burnHash in response for exitWithMatic
router.post('/burn', async (req, res) => {
  try {
    const { from, nftAddress, tokenId } = req.body
    const childContract = new ethers.Contract(nftAddress , KoChild7.abi , signerChild)

    const burnTx = await childContract.withdraw(tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('withdraw\'s response tx: ', burnTx)

    res.status(200).json({ status: 'success' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// "message error": "nonce too low" -> wait or reboot serveur
router.post('/burnWithMatic', async (req, res) => {
  try {
    const { from, nftAddress, tokenId } = req.body

    const burnTx = await maticPOSClient.burnERC721(nftAddress, tokenId, {
      from: from,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    console.log('burnERC721 txHash: ', burnTx.transactionHash)

    res.status(200).json({ status: 'success', brunHash: burnTx.transationHash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// wait for approve by operator durring 20 minutes
router.post('/exitsWithMatic', async (req, res) => {
  try {
    const { from, to, burnHash } = req.body

    const exitCalldata = await maticPOSClient.exitERC721(burnHash, {
      from: from,
      encodeAbi: true,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })
    const txHash = exitCalldata.transactionHash
    console.log('exitERC721 txHash: ', txHash)

    await signerChild.sendTransaction({
      from: from,
      to: to, // rootChainManager
      data: exitCalldata.data,
      gasPrice: 100000000000, // 100 GWEI max
      gasLimit: 5000000 // 0.005 GWEI limit
    })

    res.status(200).json({ status: 'success', txHash: txHash })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/exitsWithMatic1', async (req, res) => {
    const { from, to, burnHash } = req.body

    maticPOSClient.exitERC721(burnHash, {
      from: from,
    }).then((exitTx) => {
      console.log('exitERC721 txHash: ', exitTx.transactionHash)
      res.status(200).json({ status: 'success'})
    }).catch(err => {
      console.log(err)
      res.status(500).json({ message: err.message })
    })

    // await signerChild.sendTransaction({
    //   from: from,
    //   to: to, // rootChainManager
    //   data: exitCalldata.data,
    //   gasPrice: 100000000000, // 100 GWEI max
    //   gasLimit: 5000000 // 0.005 GWEI limit
    // })

})

export default router
