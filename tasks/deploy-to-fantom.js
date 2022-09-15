const hre = require("hardhat")

main = async () => {
    const catchNft = await hre.ethers.getContractFactory("CatchNft")
    const catchNftContract = await catchNft.deploy(
        0x7a1bac17ccc5b313516c5e16fb24f7659aa5ebed,
        10000000000000000,
        93,
        0x121a143066e0f2f08b620784af77cccb35c6242460b4a8ee251b4b416abaebd4,
        500000,
        [
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
    )
    await catchNftContract.deployed()
    console.log(`deployed to: ${catchNftContract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
