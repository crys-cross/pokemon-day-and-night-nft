import { ethers, network } from "hardhat"
// import { moveBlocks } from "../utils/move-blocks"

const PRICE = ethers.utils.parseEther("0.1")
const sleepAmount = 1000

const mint = async () => {
    const catchNft = await ethers.getContract("CatchNft")
    const mintFee = await catchNft.getMintFee()
    await catchNft.mintSwitch(true)
    console.log("Minting...")
    const mintTx = await catchNft.catchPkmn({ value: mintFee })
    const mintTxReceipt = await mintTx.wait(1)
    const event = mintTxReceipt.events[1]
    const value = event.args[0]
    const minted = value.toString()
    // console.log(
    //     `Minted tokenId ${mintTxReceipt.events[1].arg.playersCharacter} from contract: ${wishNft.address}`
    // )
    console.log(`Minted tokenId ${minted} from contract: ${catchNft.address}`)

    // if (network.config.chainId == 31337) {
    //     // Moralis has a hard time if you move more than 1 at once!
    //     await moveBlocks(2, sleepAmount)
    // }

    const triggerA = await catchNft.getCommonCounter()
    const trigger1 = await catchNft.getShinyCounter()
    const counter = await catchNft.getTokenCounter()
    console.log(`common is: ${triggerA}`)
    console.log(`shiny is: ${trigger1}`)
    console.log(`counter is: ${counter}`)
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
