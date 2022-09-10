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

let tokenUris = [
    "ipfs://QmTs42zi2Vx9WAF4RYxzJykP3nuLPgqdAj3FmzRXyE3s82",
    "ipfs://Qmf2qSF2LimAMfzRVrWDk3Epjep5YLaCJNB9YtCRzbwwEi",
    "ipfs://QmQkvDbPK4AdhzuyeDFbsrQz39S4773HxpVxjthyXd7HfJ",
    "ipfs://QmdahcPkrvNaDr9jtH8ruM77YosAPAJpS7AmwSbURtDiba",
    "ipfs://QmacNwpwBT5jfEcF699uZTB8LXioCAAFjQWBkagAMhw8WH",
    "ipfs://QmbUHUe23f5GiQjS6djvRuLCmo43ADcvgLQNWaCQKz5NAy",
    "ipfs://QmWjjAXsUch6zSFwLbMuTfVS14VJZiQTU6iGZsMo57wutZ",
    "ipfs://QmStDwhh4PqcKRHqMfHS7Y9qbSd4wfRstKPQnMuy4TTUCF",
    "ipfs://QmXdRwbYxrdrfa6y9yqWXDMaqXxEpNUJpHP3BoZ7dWLT6b",
    "ipfs://QmP76vWfhShpXM9YNwz7VsX7rz4oA2DzDeqgvQ9nMJWFzn",
    "ipfs://QmWzJWY5r7yT1nfdPgvTtaLxEuiyArPBsgKGLV4H7hm8rW",
    "ipfs://QmcJzTCxdMp23tYt4LwD4e2KdtPvPcCwag4E1F6uT9ZFjP",
    "ipfs://QmNQ5gMDdGkzE2Nm4uJLHUhkBoJ6fcrdWBR6TFXDW6BDRH",
    "ipfs://QmdHacpsX1AGt5eWknPd2EnoJGinYaJaD2VeAYFTZgXu2A",
    "ipfs://QmRj5pPjDQQe35WgAb3FpzeRWvS3afpjunzDb2zeS8G631",
    "ipfs://Qmf2xUmrU3GWxbsNgKcxg3NAfHQac3DCCDFWdX4zoYnm4k",
    "ipfs://QmfUr3qtmqsn3eajujVNUiqJ5X8gvrHd2PMvXqzTf7EKxw",
    "ipfs://QmNZPmfJdjcAmCoHTdwCGLdQA8s7mL8rVHBABQZaujS4PH",
    "ipfs://QmYxKTJ2Eq9nSAic4e4ARYGE87EjrbJcuMC2G6qGJ2F3fT",
    "ipfs://QmTRhGdds23yV4oVQLkpDaWJNUBtYhUb4FyGksoGf6PDU4",
]

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
    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId]["mintFee"],
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
    ]

    const catchNft = await deploy("CatchNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    })
    log("--------------------------------")
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(catchNft.address, args)
    }
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
deployCatchNft.tags = ["all", "catch", "main"]

//  Pikachu...
//   'ipfs://QmTs42zi2Vx9WAF4RYxzJykP3nuLPgqdAj3FmzRXyE3s82',
//  Charmander...
//   'ipfs://Qmf2qSF2LimAMfzRVrWDk3Epjep5YLaCJNB9YtCRzbwwEi',
//  Squirtle...
//   'ipfs://QmQkvDbPK4AdhzuyeDFbsrQz39S4773HxpVxjthyXd7HfJ',
//  Bulbasaur...
// 'ipfs://QmdahcPkrvNaDr9jtH8ruM77YosAPAJpS7AmwSbURtDiba',
//  Pidgey...
//   'ipfs://QmacNwpwBT5jfEcF699uZTB8LXioCAAFjQWBkagAMhw8WH',
//  Marill...
//   'ipfs://QmbUHUe23f5GiQjS6djvRuLCmo43ADcvgLQNWaCQKz5NAy',
//  Cyndaquil...
//   'ipfs://QmWjjAXsUch6zSFwLbMuTfVS14VJZiQTU6iGZsMo57wutZ',
//  Totodile...
//   'ipfs://QmStDwhh4PqcKRHqMfHS7Y9qbSd4wfRstKPQnMuy4TTUCF'
//  Chikorita...
//   'ipfs://QmXdRwbYxrdrfa6y9yqWXDMaqXxEpNUJpHP3BoZ7dWLT6b',
//  Hoothoot...
//   'ipfs://QmP76vWfhShpXM9YNwz7VsX7rz4oA2DzDeqgvQ9nMJWFzn',

//  Shiny_Pikachu...
//   'ipfs://QmWzJWY5r7yT1nfdPgvTtaLxEuiyArPBsgKGLV4H7hm8rW',
//  Shiny_Charmander...
//   'ipfs://QmcJzTCxdMp23tYt4LwD4e2KdtPvPcCwag4E1F6uT9ZFjP',
//  Shiny_Squirtle...
//   'ipfs://QmNQ5gMDdGkzE2Nm4uJLHUhkBoJ6fcrdWBR6TFXDW6BDRH',
//  Shiny_Bulbasaur...
// 'ipfs://QmdHacpsX1AGt5eWknPd2EnoJGinYaJaD2VeAYFTZgXu2A',
//  Shiny_Pidgey...
//   'ipfs://QmRj5pPjDQQe35WgAb3FpzeRWvS3afpjunzDb2zeS8G631',
//  Shiny_Marill...
//   'ipfs://Qmf2xUmrU3GWxbsNgKcxg3NAfHQac3DCCDFWdX4zoYnm4k',
//  Shiny_Cyndaquil...
//   'ipfs://QmfUr3qtmqsn3eajujVNUiqJ5X8gvrHd2PMvXqzTf7EKxw',
//  Shiny_Totodile...
//   'ipfs://QmNZPmfJdjcAmCoHTdwCGLdQA8s7mL8rVHBABQZaujS4PH'
//  Shiny_Chikorita...
//   'ipfs://QmYxKTJ2Eq9nSAic4e4ARYGE87EjrbJcuMC2G6qGJ2F3fT',
//  Shiny_Hoothoot...
//   'ipfs://QmTRhGdds23yV4oVQLkpDaWJNUBtYhUb4FyGksoGf6PDU4',
