import {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
import verify from "../utils/verify"
import { storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const FUND_AMOUNT = "1000000000000000000000" //10 LINK ethers.parseUnit
const imagesLocation = "./images/shiny"

// const metadataTemplate = {
//     name: "",
//     description: "",
//     image: "",
//     attributes: [
//         {
//             hp: 20,
//             attack: 10,
//             defense: 10,
//             sp_atk: 10,
//             sp_def: 10,
//             speed: 9,
//         },
//     ],
// }
// shiny metadata
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            hp: 20,
            attack: 10,
            defense: 10,
            sp_atk: 12,
            sp_def: 12,
            speed: 9,
        },
    ],
}

let tokenUris = []

const deployCatchNft: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId!

    let vrfCoordinatorV2Address, subscriptionId

    //get the IPFS hashes ofour images(Methods below)
    //1. With our IPFS node. https://docs.ipfs.io/
    //2. pinata https://www.pinata.cloud/   pinata-node-sdk
    //3. nft.storage(uses filecoin network) https://nft.storage/
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------")
    // await storeImages(imagesLocation)
    // const args = [
    //     vrfCoordinatorV2Address,
    //     subscriptionId,
    //     networkConfig[chainId]["gasLane"],
    //     networkConfig[chainId]["callbackGasLimit"],
    //     tokenUris,
    //     networkConfig[chainId]["mintFee"],
    // ]

    // const randomIpfsNft = await deploy("RandomIpfsNft", {
    //     from: deployer,
    //     args: args,
    //     log: true,
    //     waitConfirmations: waitBlockConfirmations || 1,
    // })
    // log("--------------------------------")
    // if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    //     log("Verifying...")
    //     await verify(randomIpfsNft.address, args)
    // }
}

const handleTokenUris = async () => {
    // Check out https://github.com/PatrickAlphaC/nft-mix for a pythonic version of uploading
    // to the raw IPFS-daemon from https://docs.ipfs.io/how-to/command-line-quick-start/
    // You could also look at pinata https://www.pinata.cloud/
    tokenUris = []
    //store the image in IPFS
    //store the metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (const imageUploadResponseIndex in imageUploadResponses) {
        //create metadata
        //upload the metadata
        let tokenUriMetadata = { ...metadataTemplate } //... unpack
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        // tokenUriMetadata.description = `A regular ${tokenUriMetadata.name} caught!`
        tokenUriMetadata.description = `A SHINY ${tokenUriMetadata.name} caught!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        // store the JSON to pinata/IPFS
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`)
    }
    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}
export default deployCatchNft
deployCatchNft.tags = ["all", "randomipfs", "main"]

// Uploading Bulbasaur...
// Uploading Charmander...
// Uploading Chikorita...
// Uploading Cyndaquil...
// Uploading Hoothoot...
// Uploading Marill...
// Uploading Pidgey...
// Uploading Pikachu...
// Uploading Squirtle...
// Uploading Totodile...

// 'ipfs://QmdahcPkrvNaDr9jtH8ruM77YosAPAJpS7AmwSbURtDiba',
//   'ipfs://Qmf2qSF2LimAMfzRVrWDk3Epjep5YLaCJNB9YtCRzbwwEi',
//   'ipfs://QmXdRwbYxrdrfa6y9yqWXDMaqXxEpNUJpHP3BoZ7dWLT6b',
//   'ipfs://QmWjjAXsUch6zSFwLbMuTfVS14VJZiQTU6iGZsMo57wutZ',
//   'ipfs://QmP76vWfhShpXM9YNwz7VsX7rz4oA2DzDeqgvQ9nMJWFzn',
//   'ipfs://QmbUHUe23f5GiQjS6djvRuLCmo43ADcvgLQNWaCQKz5NAy',
//   'ipfs://QmacNwpwBT5jfEcF699uZTB8LXioCAAFjQWBkagAMhw8WH',
//   'ipfs://QmTs42zi2Vx9WAF4RYxzJykP3nuLPgqdAj3FmzRXyE3s82',
//   'ipfs://QmQkvDbPK4AdhzuyeDFbsrQz39S4773HxpVxjthyXd7HfJ',
//   'ipfs://QmStDwhh4PqcKRHqMfHS7Y9qbSd4wfRstKPQnMuy4TTUCF'

// Uploading Shiny_Bulbasaur...
// Uploading Shiny_Charmander...
// Uploading Shiny_Chikorita...
// Uploading Shiny_Cyndaquil...
// Uploading Shiny_Hoothoot...
// Uploading Shiny_Marill...
// Uploading Shiny_Pidgey...
// Uploading Shiny_Pikachu...
// Uploading Shiny_Squirtle...
// Uploading Shiny_Totodile...

// 'ipfs://QmdHacpsX1AGt5eWknPd2EnoJGinYaJaD2VeAYFTZgXu2A',
//   'ipfs://QmcJzTCxdMp23tYt4LwD4e2KdtPvPcCwag4E1F6uT9ZFjP',
//   'ipfs://QmYxKTJ2Eq9nSAic4e4ARYGE87EjrbJcuMC2G6qGJ2F3fT',
//   'ipfs://QmfUr3qtmqsn3eajujVNUiqJ5X8gvrHd2PMvXqzTf7EKxw',
//   'ipfs://QmTRhGdds23yV4oVQLkpDaWJNUBtYhUb4FyGksoGf6PDU4',
//   'ipfs://Qmf2xUmrU3GWxbsNgKcxg3NAfHQac3DCCDFWdX4zoYnm4k',
//   'ipfs://QmRj5pPjDQQe35WgAb3FpzeRWvS3afpjunzDb2zeS8G631',
//   'ipfs://QmWzJWY5r7yT1nfdPgvTtaLxEuiyArPBsgKGLV4H7hm8rW',
//   'ipfs://QmNQ5gMDdGkzE2Nm4uJLHUhkBoJ6fcrdWBR6TFXDW6BDRH',
//   'ipfs://QmNZPmfJdjcAmCoHTdwCGLdQA8s7mL8rVHBABQZaujS4PH'
