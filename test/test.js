let KittyCore = artifacts.require("./KittyCore.sol");
let KittyFight = artifacts.require("./KittyFight.sol");

let kittyCoreInstance;
let kittyFightInstance;

contract('KittyFight Contract', function (accounts) {
  it("KittyCore contract deployment", function() {
    return KittyCore.deployed().then(function (instance) {
      kittyCoreInstance = instance;
      assert(kittyCoreInstance !== undefined, 'KittyCore contract should be defined');
    });
  });

  it("Create the first two kitties", function() {
    const kittyGenes1 = '626837621154801616088980922659877168609154386318304496692374110716999053';
    return kittyCoreInstance.createPromoKitty(kittyGenes1, accounts[0]).then(function (result) {
      assert.equal('0x01', result.receipt.status, 'Kitty 1 created');
      const kittyGenes2 = '623332824742417442073801652020554010523726975553705023219600667807529387';
      return kittyCoreInstance.createPromoKitty(kittyGenes2, accounts[0]);
    }).then(function (result) {
      assert.equal('0x01', result.receipt.status, 'Kitty 2 created');
    });
  });

  it("KittyFight contract deployment", function() {
    return KittyFight.deployed().then(function (instance) {
      kittyFightInstance = instance;
      assert(kittyFightInstance !== undefined, 'KittyFight contract should be defined');
    });
  });

  it("Set kittyCore instance to kittyFight", function() {
    return kittyFightInstance.setKittyCoreAddress(kittyCoreInstance.address).then(function (result) {
      assert.equal('0x01', result.receipt.status, 'KittyCore address set');
    });
  });

  it("Fight!", function() {
    return kittyFightInstance.fight(1, 2).then(function (result) {
      assert.equal('0x01', result.receipt.status, 'Fight done');
    });
  });

  it("Fight stats for kitty 1", function() {
    return kittyFightInstance.stats(1).then(function (result) {
      assert.equal(1, result.wins.toNumber() + result.losses.toNumber() + result.draws.toNumber(), 'One win, loss or draw');
    });
  });

  it("Fight stats for kitty 2", function() {
    return kittyFightInstance.stats(2).then(function (result) {
      assert.equal(1, result.wins.toNumber() + result.losses.toNumber() + result.draws.toNumber(), 'One win, loss or draw');
    });
  });

  it("Can't fight with a not owned kitty", function() {
    return kittyFightInstance.fight(1, 2, { from: accounts[1] })
      .then(function (result) {
          throw("Condition not implemented in Smart Contract");
      }).catch(function (e) {
        if(e === "Condition not implemented in Smart Contract") {
          assert(false);
        } else {
          assert(true);
        }
    })
  });
});
