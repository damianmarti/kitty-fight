# KittyFight

Experimental project with CryptoKitties fights.

The KittyFight contract interact with the CryptoKitties core contract to get the kitties genes.

The fight result is generated from the kitties genes and some pseudo randomness. 



## Install libraries:

```bash
npm install
```

## Start the test network with:

```bash
truffle develop
```

## Deploy the contracts with:

```bash
truffle migrate
```

## Run the tests:

```bash
truffle test
```

## Testing:

You can create some test kitties using truffle console:

```bash
truffle console

let kittyCore = await KittyCore.deployed()
kittyCore.createPromoKitty('626837621154801616088980922659877168609154386318304496692374110716999053','0x905B8ba9C9378c9876980e86CFB146B5C447C32e')
kittyCore.createPromoKitty('623332824742417442073801652020554010523726975553705023219600667807529387','0x905B8ba9C9378c9876980e86CFB146B5C447C32e')
```

## Start web development server:

```bash
npm run dev
```

## Configure Metamask

Set the test network on Metamask with the info on truffle-config.js and import the generated seed when truffle develop was started.


