import "dotenv/config"
import fs from "fs"
import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const frontEndContractsFile = "../pokemon-dnn-frontend/constants/networkAddresses.json"
const frontEndAbiFile = "../pokemon-dnn-frontend/constants/pokemonNftAbi.json"

const updateUI: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating Front End")
        const catchNft = await ethers.getContract("CatchNft")
        const chainId = network.config.chainId!
        const currentAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
        if (chainId in currentAddresses) {
            if (!currentAddresses[chainId]["CatchNft"].includes(catchNft.address)) {
                currentAddresses[chainId]["CatchNft"].push(catchNft.address)
            }
        } else {
            currentAddresses[chainId] = { CatchNft: [catchNft.address] }
        }
        fs.writeFileSync(frontEndContractsFile, JSON.stringify(currentAddresses))
        console.log("Addresses written!")
        fs.writeFileSync(
            frontEndAbiFile,
            catchNft.interface.format(ethers.utils.FormatTypes.json).toString()
        )
        console.log("ABI written!")
        console.log("Front ends written!")
    }
}
// const updateContractAddresses = async () => {
//     const catchNft = await ethers.getContract("CatchNft")
//     const chainId = network.config.chainId!.toString()
//     const currentAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
//     if (chainId in currentAddresses) {
//         if (!currentAddresses[chainId]["CatchNft"].includes(catchNft.address)) {
//             currentAddresses[chainId]["CatchNft"].push(catchNft.address)
//         }
//     } else {
//         currentAddresses[chainId] = { CatchNft: [catchNft.address] }
//     }
//     fs.writeFileSync(frontEndContractsFile, JSON.stringify(currentAddresses))
//     console.log("Addresses written!")
// }
// const updateAbi = async () => {
//     const catchNft = await ethers.getContract("CatchNft")
//     fs.writeFileSync(
//         frontEndAbiFile,
//         catchNft.interface.format(ethers.utils.FormatTypes.json).toString()
//     )
//     console.log("ABI written!")
// }

export default updateUI
updateUI.tags = ["all", "frontend"]
