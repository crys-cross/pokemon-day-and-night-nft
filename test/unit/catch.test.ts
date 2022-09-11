import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"
import { assert, expect } from "chai"
import { getNamedAccounts, deployments, ethers, network } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { CatchNft, VRFCoordinatorV2Mock } from "../../typechain-types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CatchNft Unit Test", () => {
          let catchNftPlayer: CatchNft
          let catchNftContract: CatchNft
          let catchNftOwner: CatchNft
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
          let mintFee: BigNumber
          let accounts: SignerWithAddress[]
          let deployer: SignerWithAddress
          let player: SignerWithAddress

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["mocks", "catch"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              catchNftContract = await ethers.getContract("CatchNft")
              catchNftOwner = catchNftContract.connect(deployer)
              catchNftPlayer = catchNftContract.connect(player)
              mintFee = await catchNftPlayer.getMintFee()
              await catchNftOwner.mintSwitch(true)
          })
          describe("constructor", async () => {
              it("sets starting values correctly", async () => {
                  const characterUriZero = await catchNftPlayer.getPKMNTokenUris(0)
                  const isInitialized = await catchNftPlayer.getInitialized()
                  assert(characterUriZero.includes("ipfs://"))
                  assert.equal(isInitialized, true)
              })
          })
          describe("catchPkmn", async () => {
              it("fails if mintSwitch is disabled", async () => {
                  await catchNftOwner.mintSwitch(false)
                  await expect(
                      catchNftPlayer.catchPkmn({ value: mintFee.toString() })
                  ).to.be.revertedWithCustomError(catchNftOwner, "CatchNft__MintSwitchedOffbyOwner")
              })
              it("fails if not enought ETH sent", async () => {
                  await expect(catchNftPlayer.catchPkmn()).to.be.revertedWithCustomError(
                      catchNftPlayer,
                      "CatchNft__NeedMoreETHSennt"
                  )
              })
          })
          describe("fulfillRandomWords", async () => {
              it("mints NFT after random number is returned", async () => {
                  await new Promise<void>(async (resolve, reject) => {
                      catchNftPlayer.once("NftMinted", async () => {
                          try {
                              const tokenUri = await catchNftPlayer.tokenURI(0)
                              const tokenCounter = await catchNftPlayer.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await catchNftPlayer.catchPkmn({
                              value: mintFee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events![1].args!.requestId,
                              catchNftPlayer.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
              describe("withdraw", async () => {
                  it("only owner can withdraw", async () => {
                      await catchNftOwner.withdraw()
                      const balance = await ethers.provider.getBalance(catchNftContract.address)
                      assert.equal(balance.toString(), "0")
                  })
              })
          })
      })
