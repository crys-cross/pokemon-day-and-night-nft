// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__RangeOutOfBounds();
error CatchNft__NeedMoreETHSennt();

contract Catch is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type Declaration
    enum DayEncounter {
        PIKACHU,
        CHARMANDER,
        SQUIRTLE,
        BULBASAUR,
        PIDGEY
    }

    enum NightEncounter {
        EEVEE,
        CYNDAQUIUL,
        TOTODILE,
        CHIKORITA,
        HOOTHOOT
    }

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 3;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    uint256 internal immutable i_mintFee;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function catchNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert CatchNft__NeedMoreETHSennt();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE; //0-99
        uint256 moddedRngShiny = randomWords[1] % MAX_CHANCE_VALUE; //0-99 //draft shiny check with shiny function
        // -DAY-NIGHT
        // 0-5 -> PIKACHU, EEVEE
        // 06-15 -> CHARMANDER, CYNDAQUIUL
        // 16-25 -> SQUIRTLE, TOTODILE
        // 26-35 -> BULBASAUR, CHIKORITA
        // 36-99 -> PIDGEY, HOOTHOOT
        if ((now / 3600) % 24 <= 12) {
            //used to check if night or day(00-12day, 13-24night)
            DayEncounter dogBreed = getBreedFromModdedRng(moddedRng);
        } else {
            NightEncounter dogBreed = getBreedFromModdedRng(moddedRng);
        }
        //function for shiny chance using randomWords[1]
        s_tokenCounter += s_tokenCounter;
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    //draft for shiny chance
    function checkShiny(uint256 moddedRngShiny) internal {
        if (moddedRngShiny <= 2) {
            /*turn shiny*/
        } else {
            /*use normal*/
        }
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }
}

//Pokemon Rate
//Day 5% pikachu gen1(10%,10%,10%) common(pidgey) 65%
//Night 5% evee gen2(10%,10%,10%) common(hoothoot) 65%
//Shiny 1%

//TODO
//draft set enums values with arrays of [normal, shiny]
//convert now to time✅
//set mint function for day and night(if statement to call)✅
//randomWords[0] to choose random pkmn from day or night✅
//randomWords[1] minting shiny/or not pokemon irregardless of pokemon rarity
//set random pokemonstats(TBA)
//TODO-2
//set pokemon battle
//set pokemon level ups(refer to defi kingdoms implementation)

// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.8;

// import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
// import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// error RandomIpfsNft__RangeOutOfBounds();
// error RandomIpfsNft__NeedMoreETHSennt();
// error RandomIpfsNft__TransferFailed();

// contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
//     // when we mint an NFT, we will trigger a Chainlink VRF call to get us a random number
//     // using that number we will get a random NFT(Pug[super rare], Shiba Inu[sort of rare], St. Bernard[common])
//     // users need to pay to mint an NFT which owner can withdraw

//     // Type Declaration
//     enum Breed {
//         PUG,
//         SHIBA_INU,
//         ST_BERNARD
//     }

//     // Chainlink VRF Variables
//     VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
//     uint64 private immutable i_subscriptionId;
//     bytes32 private immutable i_gasLane;
//     uint32 private immutable i_callbackGasLimit;
//     uint16 private constant REQUEST_CONFIRMATIONS = 3;
//     uint32 private constant NUM_WORDS = 1;

//     // VRF Helpers
//     mapping(uint256 => address) public s_requestIdToSender;

//     // NFT Variables
//     uint256 public s_tokenCounter;
//     uint256 internal constant MAX_CHANCE_VALUE = 100;
//     string[] internal s_dogTokenUris;
//     uint256 internal immutable i_mintFee;

//     // Events
//     event NftRequested(uint256 indexed requestId, address requester);
//     event NftMinted(Breed dogBreed, address minter);

//     constructor(
//         address vrfcoordinatorV2,
//         uint64 subscriptionId,
//         bytes32 gasLane,
//         uint32 callbackGasLimit,
//         string[3] memory dogTokenUris,
//         uint256 mintFee
//     ) VRFConsumerBaseV2(vrfcoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
//         i_vrfCoordinator = VRFCoordinatorV2Interface(vrfcoordinatorV2);
//         i_subscriptionId = subscriptionId;
//         i_gasLane = gasLane;
//         i_callbackGasLimit = callbackGasLimit;
//         s_dogTokenUris = dogTokenUris;
//         i_mintFee = mintFee;
//     }

//     function requestNft() public payable returns (uint256 requestId) {
//         if (msg.value < i_mintFee) {
//             revert RandomIpfsNft__NeedMoreETHSennt();
//         }
//         requestId = i_vrfCoordinator.requestRandomWords(
//             i_gasLane,
//             i_subscriptionId,
//             REQUEST_CONFIRMATIONS,
//             i_callbackGasLimit,
//             NUM_WORDS
//         );
//         s_requestIdToSender[requestId] = msg.sender;
//         emit NftRequested(requestId, msg.sender);
//     }

//     function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
//         address dogOwner = s_requestIdToSender[requestId];
//         uint256 newTokenId = s_tokenCounter;
//         uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE; //0-99
//         // 0-10 -> PUG
//         // 11-30 -> Shiba Inu
//         // 31-99 -> St. Bernard
//         Breed dogBreed = getBreedFromModdedRng(moddedRng);
//         s_tokenCounter += s_tokenCounter;
//         _safeMint(dogOwner, newTokenId);
//         _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
//         emit NftMinted(dogBreed, dogOwner);
//     }

//     function withdraw() public onlyOwner {
//         uint256 amount = address(this).balance;
//         (bool success, ) = payable(msg.sender).call{value: amount}("");
//         if (!success) {
//             revert RandomIpfsNft__TransferFailed();
//         }
//     }

//     function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
//         uint256 cumulativeSum = 0;
//         uint256[3] memory chanceArray = getChanceArray();
//         for (uint256 i = 0; i < chanceArray.length; i++) {
//             if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
//                 return Breed(i);
//             }
//             cumulativeSum += chanceArray[i];
//         }
//         revert RandomIpfsNft__RangeOutOfBounds();
//     }

//     function getChanceArray() public pure returns (uint256[3] memory) {
//         return [10, 30, MAX_CHANCE_VALUE];
//     }

//     function getMintFee() public view returns (uint256) {
//         return i_mintFee;
//     }

//     function getDogTokenUris(uint256 index) public view returns (string memory) {
//         return s_dogTokenUris[index];
//     }

//     function getTokenCounter() public view returns (uint256) {
//         return s_tokenCounter;
//     }
// }
