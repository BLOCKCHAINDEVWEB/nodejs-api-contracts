import dotenv from 'dotenv'
import path from 'path'
import { MaticPOSClient } from '@maticnetwork/maticjs'
import { ethers } from 'ethers'
import HDWalletProvider from '@truffle/hdwallet-provider'
import config from '../../config'

dotenv.config({ path: path.join(__dirname, '../../.env') })

// const parentProvider = new ethers.providers.JsonRpcProvider(config.root.RPC)
// const maticProvider = new ethers.providers.JsonRpcProvider(config.child.RPC)

const getMaticPOSClient = () => {
  return new MaticPOSClient({
    network: "testnet", // For mainnet change this to mainnet
    version: "mumbai", // For mainnet change this to v1
    // parentProvider: new ethers.Wallet(process.env.PRIVATE_KEY, parentProvider),
    // maticProvider: new ethers.Wallet(process.env.PRIVATE_KEY, maticProvider),
    parentProvider: new HDWalletProvider(process.env.PRIVATE_KEY, config.root.RPC),
    maticProvider: new HDWalletProvider(process.env.PRIVATE_KEY, config.child.RPC),
    // posRootChainManager: config.root.POSRootChainManager,
    // posERC721Predicate: config.root.posERC721Predicate,
    parentDefaultOptions: { from: process.env.PUBLIC_KEY },
    maticDefaultOptions: { from: process.env.PUBLIC_KEY },
  })
}

export default getMaticPOSClient

