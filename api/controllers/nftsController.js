import dotenv from 'dotenv'
import path from 'path'
import { ethers } from 'ethers'
import * as sigUtil from 'eth-sig-util'
import * as ethUtil from 'ethereumjs-util'
import KoChild6 from '../artifacts6/tokenNFT.json'
import config from '../../config'

dotenv.config({ path: path.join(__dirname, '../../.env') })

export const chainId = {
  chainMumbai: 80001,
  chainMainet: 137
}

export const token = {
  name: 'Ko Digital Collectible',
  symbol: 'KODC',
  version: '1'
}

export const estimateFeeGas = async (provider, dataTx) => {
  const estimateGasBN = await provider.estimateGas(dataTx)
  const gasLimit = Number(estimateGasBN)
  const gasPrice = Number(await provider.getGasPrice())
  const maxFeeGas = await provider.getFeeData()
  const maxFeePerGas= Number(maxFeeGas.maxFeePerGas)
  const maxPriorityFeePerGas = Number(maxFeeGas.maxPriorityFeePerGas)
  const estimateGas = Number(estimateGasBN)
  return { estimateGas, gasPrice, gasLimit, maxFeePerGas, maxPriorityFeePerGas }
}

export const getEIP712Type = ({ name, version,verifyingContract, salt, nonce, from, functionSignature }) => {
  return {
    types: {
      EIP712Domain: [{
        name: 'name',
        type: 'string'
      }, {
        name: 'version',
        type: 'string'
      }, {
        name: 'verifyingContract',
        type: 'address'
      }, {
        name: 'salt',
        type: 'bytes32'
      }],
      MetaTransaction: [{
        name: 'nonce',
        type: 'uint256'
      }, {
        name: 'from',
        type: 'address'
      }, {
        name: 'functionSignature',
        type: 'bytes'
      }]
    },
    domain: {
      name,
      version,
      verifyingContract,
      salt
    },
    primaryType: 'MetaTransaction',
    message: {
      nonce,
      from,
      functionSignature
    }
  }
}

export const fctSignTransfertFrom = (from, to, tokenId) => {
  const transferFunctionAbi = ["function transferFrom(address from, address to, uint256 tokenId)"]
  const iTransferFunction = new ethers.utils.Interface(transferFunctionAbi)
  const fctSign = iTransferFunction.encodeFunctionData("transferFrom", [from, to, tokenId])
  return fctSign
}

export const getTxDataTransfer = async (contract, datas, privateKey) => {
  const { chainMumbai } = chainId
  const { name, version, childAddress, from, to, tokenId } = datas
  const nonce = await contract.getNonce(from)
  const fctSign = fctSignTransfertFrom(from, to, tokenId)

  const msgParams = getEIP712Type({
    name: name,
    version: version,
    verifyingContract: childAddress,
    salt: '0x'.concat(chainMumbai.toString(16).padStart(64, '0')),
    nonce: Number(nonce),
    from: from,
    functionSignature: fctSign
  })

  const privateKeyBuffer = Buffer.from(privateKey, "hex")

  const sig = sigUtil.signTypedData_v4(
    privateKeyBuffer,
    {data: msgParams}
  )

  const { r, s, v } = ethUtil.fromRpcSig(sig)
  return { fctSign, r, s, v }
}

export const nftContractIsDeploy = async (name, symbol) => {
  try {
    // polygon node url
    const privateKey = process.env.PRIVATE_KEY
    const childChainManager = config.child.POSChildChainManager
    const maticProvider = config.child.RPC
    const providerChild = new ethers.providers.JsonRpcProvider(maticProvider)
    const signerChild = new ethers.Wallet(privateKey, providerChild)
    // The factory we use for deploying contracts
    const factory = new ethers.ContractFactory(KoChild5.abi, KoChild5.bytecode, signerChild)
    // Deploy an instance of the contract
    const childNftContract = await factory.deploy(name, symbol, childChainManager)
    // The transaction that the signer sent to deploy
    await childNftContract.deployTransaction
    // Wait until the transaction is mined (i.e. contract is deployed)
    const txDeploy = await childNftContract.deployTransaction.wait()
    const { contractAddress, transactionHash } = txDeploy

    return { contractAddress, transactionHash }
  } catch (err) {
    console.log(err)
  }
}