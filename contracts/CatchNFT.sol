// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error CatchNft__RangeOutOfBounds();
error CatchNft__NeedMoreETHSennt();
error CatchNft__TransferFailed();
error CatchNft__AlreadyInitialized();
error CatchNft__MintSwitchedOffbyOwner();

/**
 *  @title BLOCKCHAIN POKEMON NFT
 *  @author crys
 *  @notice This is demo smartcontract game using very similar encounter/catch mechanics to the Pokemon Game
 *  @dev This uses Chainlink VRF for randomizaton and some math
 *  to simulate as close as possible rates to the pokemon game.
 *  Uses block.timestamp for time to separate night and day pokemon.
 *  Higher chance(1%) than the game to catch a shiny pokemon
 **/

contract CatchNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type Declaration
    enum Pkmns {
        PIKACHU,
        CHARMANDER,
        SQUIRTLE,
        BULBASAUR,
        PIDGEY,
        MARILL,
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
    uint32 private constant NUM_WORDS = 2;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 private immutable i_mintFee;
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_pkmnUris;
    bool private s_initialized;
    bool public mintEnabled;
    uint256 public s_commonCounter;
    uint256 public s_shinyCounter;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Pkmns pkmns, address pkmnOwner);

    constructor(
        address vrfCoordinatorV2,
        uint256 mintFee,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[20] memory pkmnUris
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random PKMN NFT", "PM") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_mintFee = mintFee;
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        _initializeContract(pkmnUris);
    }

    function catchPkmn() public payable returns (uint256 requestId) {
        if (mintEnabled == false) {
            revert CatchNft__MintSwitchedOffbyOwner();
        }
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
        address pkmnOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        uint256 moddedRngShiny = randomWords[1] % MAX_CHANCE_VALUE;
        // ----------DAY------NIGHT
        // 00-05 -> PIKACHU, MARILL
        // 06-15 -> CHARMANDER, CYNDAQUIUL
        // 16-25 -> SQUIRTLE, TOTODILE
        // 26-35 -> BULBASAUR, CHIKORITA
        // 36-99 -> PIDGEY, HOOTHOOT
        Pkmns pkmnType = getPkmn(moddedRng);
        uint256 pkmnIndex = 0;
        if (moddedRngShiny % 100 < 2) {
            s_shinyCounter += 1;
            pkmnIndex = uint256(pkmnType) + 10;
        } else {
            s_commonCounter += 1;
            pkmnIndex = uint256(pkmnType);
        }
        s_tokenCounter += 1;
        _safeMint(pkmnOwner, newTokenId);
        _setTokenURI(newTokenId, s_pkmnUris[pkmnIndex]);
        emit NftMinted(pkmnType, pkmnOwner);
    }

    function getChanceArray() public pure returns (uint256[5] memory) {
        return [5, 15, 25, 35, MAX_CHANCE_VALUE];
    }

    function _initializeContract(string[20] memory pkmnUris) private {
        if (s_initialized) {
            revert CatchNft__AlreadyInitialized();
        }
        s_pkmnUris = pkmnUris;
        s_initialized = true;
    }

    function getPkmn(uint256 moddedRng) public view returns (Pkmns) {
        uint256 cumulativeSum = 0;
        uint256[5] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                if ((block.timestamp / 3600) % 24 > 12) {
                    //used to check if night or day(00-12 is day, 13-24 is night)
                    return Pkmns(i + 5);
                } else {
                    return Pkmns(i);
                }
            }
            cumulativeSum = chanceArray[i];
        }
        revert CatchNft__RangeOutOfBounds();
    }

    /*enable/disable mint here*/
    function mintSwitch(bool _mintEnabled) external onlyOwner {
        mintEnabled = _mintEnabled; //it allows us public to mint(true) or not(false)
    }

    /*withdraw function for admin*/
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert CatchNft__TransferFailed();
        }
    }

    /*for experimental burn nft*/
    function release(uint256 tokenId) public {
        _burn(tokenId);
    }

    /*View/Pure Functions*/
    function getIsMintSwitchEnabled() public view returns (bool) {
        return mintEnabled;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getPKMNTokenUris(uint256 index) public view returns (string memory) {
        return s_pkmnUris[index];
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getCommonCounter() public view returns (uint256) {
        return s_commonCounter;
    }

    function getShinyCounter() public view returns (uint256) {
        return s_shinyCounter;
    }

    function getIsItDayTime() public view returns (bool) {
        if ((block.timestamp / 3600) % 24 <= 12) {
            return true;
        } else {
            return false;
        }
    }
}
