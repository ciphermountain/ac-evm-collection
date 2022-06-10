require("dotenv").config();
const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.MNEUMONIC_RINKEBY, `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`),
      from: process.env.DEPLOY_ADDRESS_RINKEBY,
      gas: 5300000,
      gasPrice: 30000000000,
      network_id: 4,
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.MNEUMONIC_MAINNET, `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
      from: process.env.DEPLOY_ADDRESS_MAINNET,
      gas: 6721975,
      gasPrice: 50000000000,
      skipDryRun: true,
      network_id: 1,
      timeoutBlocks: 200, // ~50 minutes
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.13",
      parser: "solcjs",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1500
        }
      }
    }
  },

  plugins: ['truffle-plugin-verify'],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
    // enabled: false,
    // host: "127.0.0.1",
    // adapter: {
    //   name: "sqlite",
    //   settings: {
    //     directory: ".db"
    //   }
    // }
  // }
};
