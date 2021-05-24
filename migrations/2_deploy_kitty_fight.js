const KittyCore = artifacts.require("./KittyCore.sol")
const KittyFight = artifacts.require("KittyFight");

module.exports = function(deployer) {
  deployer.then(async () => {
  	const kittyCore = await KittyCore.deployed();

  	const kittyFight = await deployer.deploy(KittyFight, kittyCore.address);
  	console.log('KittyFight contract deployed at', kittyFight.address)
  })
};
