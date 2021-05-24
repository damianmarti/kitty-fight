pragma solidity ^0.4.18;

import "./KittyCore.sol";

contract KittyFight is Ownable {

    struct KittyFightInfo {
        uint32 wins;
        uint32 losses;
        uint32 draws;
    }

    enum RoundResult {
    	Challenger,
    	Opponent,
    	Draw
    }

    // CryptoKitties core contract address
    KittyCore public kittyCoreAddress;

    // fighting stats for each kitty
    mapping (uint256 => KittyFightInfo) public stats;

    //event Rand(uint8 rand0, uint8 rant1, uint8 rand2);
    //event Genes(uint256 gen0, uint256 gen1, uint256 gen2);
    event Fight(uint8 round1, uint8 round2, uint8 round3, uint8 game);

    /// @dev Constructor creates a reference to the kitty core contract
    /// @param _kittyCoreAddress - address of the deployed kitty core contract.
    function KittyFight(address _kittyCoreAddress) public {
        kittyCoreAddress = KittyCore(_kittyCoreAddress);
    }

    /// @dev Set reference to the kitty core contract
    /// @param _kittyCoreAddress - address of the deployed kitty core contract.
    function setKittyCoreAddress(address _kittyCoreAddress) external onlyOwner {
    	kittyCoreAddress = KittyCore(_kittyCoreAddress);
    }

    /// @dev Returns true if the claimant owns the token.
    /// @param _claimant - Address claiming to own the token.
    /// @param _tokenId - ID of token whose ownership to verify.
    function owns(address _claimant, uint256 _tokenId) public view returns (bool) {
        return (kittyCoreAddress.ownerOf(_tokenId) == _claimant);
    }

    /// @dev Returns 3 pseudo random numbers.
    function _randomNumbers() internal view returns (uint8[3] memory) {
    	uint8[3] memory randomNumbers;
    	uint256 random = uint256(keccak256(block.timestamp, block.difficulty));
		randomNumbers[0] = uint8(random%240);
		randomNumbers[1] = uint8(random>>8%240);
		randomNumbers[2] = uint8(random>>16%240);
		return randomNumbers;
    }

    /// @dev Returns 3 pseudo random selected genes.
    /// @param _genes - Genes.
    /// @param _numbers - 3 numbers to select the bit genes
    function _randomGenes(uint256 _genes, uint8[3] _numbers) internal pure returns (uint256[3] memory) {
    	uint256[3] memory randomGenes;
    	uint256 one = 1;
		randomGenes[0] = _genes & (one << _numbers[0]);
		randomGenes[1] = _genes & (one << _numbers[1]);
		randomGenes[2] = _genes & (one << _numbers[2]);
		return randomGenes;
    }

    /// @dev Get the result from a fighting round.
    /// @param _kittyGen - Gen from challenger kitty.
    /// @param _opponentGen - Gen from opponent kitty.
    function _round(uint256 _kittyGen, uint256 _opponentGen) internal pure returns (RoundResult) {
    	if (_kittyGen > _opponentGen) {
    		return RoundResult.Challenger;
    	}
    	if (_kittyGen < _opponentGen) {
    		return RoundResult.Opponent;
    	}
    	return RoundResult.Draw;
    }

    /// @dev Fight a round for each 3 selected genes.
    /// @param _kittyRandomGenes - Selected genes from challenger kitty.
    /// @param _opponentRandomGenes - Selected genes from opponent kitty.
    function _fight(uint256[3] _kittyRandomGenes, uint256[3] _opponentRandomGenes) internal pure returns (RoundResult[3] memory) {
    	RoundResult[3] memory roundResults;
    	for (uint8 i = 0; i < 3; i++) {
    		roundResults[i] = _round(_kittyRandomGenes[i], _opponentRandomGenes[i]);
    	}
    	return roundResults;
    }

    /// @dev Calculate winner from the 3 round results.
    /// @param _roundResults - Results from the 3 rounds.
    function _calculateWinner(RoundResult[3] memory _roundResults) internal pure returns (RoundResult) {
    	uint8 kittyPoints;
    	uint8 opponentPoints;
    	for (uint8 i = 0; i < 3; i++) {
    		if (_roundResults[i] == RoundResult.Challenger) {
    			kittyPoints++;
    		}
    		if (_roundResults[i] == RoundResult.Opponent) {
    			opponentPoints++;
    		}
    	}
    	if (kittyPoints > opponentPoints) {
    		return RoundResult.Challenger;
    	}
    	if (kittyPoints < opponentPoints) {
    		return RoundResult.Opponent;
    	}
    	return RoundResult.Draw;
    }

    /// @dev Fight kitties.
    /// @param _kittyId - Id from challenger kitty.
    /// @param _opponentId - Id from opponent kitty.
	function fight(uint256 _kittyId, uint256 _opponentId) external returns (uint8) {
		// only the kitty owner can start a fight
		require(owns(msg.sender, _kittyId));

		bool kittyIsGestating;
		bool opponentIsGestating;
		uint256 kittyGenes;
		uint256 opponentGenes;

		(kittyIsGestating,,,,,,,,,kittyGenes) = kittyCoreAddress.getKitty(_kittyId);
		(opponentIsGestating,,,,,,,,,opponentGenes) = kittyCoreAddress.getKitty(_opponentId);

		// no kitties gestating
		require(!kittyIsGestating && !opponentIsGestating);

		// pseudo random numbers to select 3 bits for fight
		uint8[3] memory randomNumbers = _randomNumbers();
		//Rand(randomNumbers[0], randomNumbers[1], randomNumbers[2]);

		uint256[3] memory kittyRandomGenes = _randomGenes(kittyGenes, randomNumbers);
		//Genes(kittyRandomGenes[0], kittyRandomGenes[1], kittyRandomGenes[2]);

		uint256[3] memory opponentRandomGenes = _randomGenes(opponentGenes, randomNumbers);
		//Genes(opponentRandomGenes[0], opponentRandomGenes[1], opponentRandomGenes[2]);

		RoundResult[3] memory roundResults = _fight(kittyRandomGenes, opponentRandomGenes);

		RoundResult result = _calculateWinner(roundResults);

		// update stats from both kitties
		if (result == RoundResult.Challenger) {
			stats[_kittyId].wins++;
			stats[_opponentId].losses++;
		}
		if (result == RoundResult.Opponent) {
			stats[_opponentId].wins++;
			stats[_kittyId].losses++;
		}
		if (result == RoundResult.Draw) {
			stats[_kittyId].draws++;
			stats[_opponentId].draws++;
		}

		// log result from each round and the final match
		Fight(uint8(roundResults[0]), uint8(roundResults[1]), uint8(roundResults[2]), uint8(result));

		return uint8(result);
	}
}