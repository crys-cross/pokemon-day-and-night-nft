import { assert, expect } from "chai"
import { getNamedAccounts, deployments, ethers, network } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", () => {
          let raffle, VRFCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId
      })
