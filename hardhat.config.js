require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

let config = {
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: '1000000000000000000000000000' // 1 billion ETH
      },
      allowUnlimitedContractSize: true
    }
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      }
    }
  }
}

if (process.env.GOERLI_CONFIGURED) {
  config.networks.goerli = {
    url: process.env.GOERLI_URL,
    accounts: {
      mnemonic: process.env.GOERLI_MNEMONIC
    }
  }
}

if (process.env.MAINNET_CONFIGURED) {
  config.networks.mainnet = {
    url: process.env.MAINNET_URL,
    accounts: {
      mnemonic: process.env.MAINNET_MNEMONIC
    }
  }
}

module.exports = config
