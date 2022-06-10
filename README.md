# Setting up Your Environment

A few components are necessary to run tests or deployments on the contained contracts.

## Dependencies

- npm
- truffle build tools

## Install Packages

```
$ npm i
```

# Testing the Contracts

To verify that the contracts conform to tests, run the following truffle command.

```
$ truffle test
```

# Setting ENV Variables

Unique configurations for migrations per user are contained in the `.env` file. Consult `.env.example` for a list and example of 
all available env variables.

# Deploy to Test Network

Rinkeby is the provided test network configuration, but you can add more in the truffle config.
The following command runs migrations to the Rinkeby test network.

```
$ truffle migrate --network rinkeby
```

## Verify the Contract

```
truffle run verify ERC721EnumerablePausable --network rinkeby
```

# Deploy to Mainnet

Mainnet truffle migrations aren't particularly useful since the mainnet is so much slower at deploying, unless you want to pay full
gas prices. The strategy is to run migrations one at a time and save the results in a log file. The following command runs the migration
file number `2` only. You can also run ranges if you like.

```
truffle migrate -f 2 --to 2 --network mainnet >> migrations.log
```

WARNING!! Be sure to keep the log file as this tells you the address where your contract was deployed to!!

## Verify Contract

```
truffle run verify ERC721EnumerablePausable@[contracthash] --network mainnet
```