import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, './.env') })

export default {
  // POSContracts: test7KO
  root: {
    RPC: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    POSRootChainManager: "0xBbD7cBFA79faee899Eaf900F13C9065bF03B1A74",  // RootChainManagerProxy
    DERC721: "0x5E891015ED99d7C5c9eB5527658B4649F3f26c45",  // tokens address deploy
    posERC721Predicate: "0x74D83801586E9D3C4dc45FfCD30B54eA9C88cf9b",   // ERC721PredicateProxy (maticSDK)
    posMintableERC721Predicate: "0x56E14C4C1748a818a5564D33cF774c59EB3eDF59",  // MintableERC721PredicateProxy
  },
  child: {
    RPC: "https://rpc-mumbai.maticvigil.com/v1/339bfd1060db13f0f39cac79e2cca45b637c93e9",
    POSChildChainManager: "0xb5505a6d998549090530911180f38aC5130101c6",  // ChildChainManagerProxy
    DERC721: "0x554DAc4f6d076290dBa8469E9F2d1090A6DEd458",  // tokens address deploy
  },
}
// rootAddressToken6: 0x1361d78d3375Eb11E0cc5a8a3423E3aC7c2513A5
// rootdAddressToken7: 0x5E891015ED99d7C5c9eB5527658B4649F3f26c45

// childdAddressToken6: 0x5e461b51f270947340b71b5d3a9fcB0C47EEb15b
// childAddressToken7: 0x554DAc4f6d076290dBa8469E9F2d1090A6DEd458

// RootChainManager: 0xBbD7cBFA79faee899Eaf900F13C9065bF03B1A74 // RootChainManagerProxy
// ChildChainManager: 0xb5505a6d998549090530911180f38aC5130101c6  // ChildChainManagerProxy
// ERC721PredicateProxy: 0x74D83801586E9D3C4dc45FfCD30B54eA9C88cf9b
// MintableERC721PredicateProxy: 0x56E14C4C1748a818a5564D33cF774c59EB3eDF59