let provider;

detectEthereumProvider().then(function(prov) {
  console.log(prov);
  if (prov) {
    provider = prov;
    startApp(provider); // Initialize your app
  } else {
    console.log('Please install MetaMask!');
  }
})


function startApp(provider) {
  // If the provider returned by detectEthereumProvider is not the same as
  // window.ethereum, something is overwriting it, perhaps another wallet.
  if (provider !== window.ethereum) {
    console.error('Do you have multiple wallets installed?');
  }
  // Access the decentralized web!
    App.init();
    console.log('starting app.js');
}

/**********************************************************/
/* Handle chain (network) and chainChanged (per EIP-1193) */
/**********************************************************/

let chainId;


ethereum.request({ method: 'eth_chainId' }).then(function(cId) {
  chainId = cId;
  handleChainChanged(chainId);
});

ethereum.on('chainChanged', handleChainChanged);

function handleChainChanged(_chainId) {
  // We recommend reloading the page, unless you must do otherwise
  //window.location.reload();
}

/***********************************************************/
/* Handle user accounts and accountsChanged (per EIP-1193) */
/***********************************************************/

let currentAccount = null;
ethereum
  .request({ method: 'eth_accounts' })
  .then(handleAccountsChanged)
  .catch((err) => {
    // Some unexpected error.
    // For backwards compatibility reasons, if no accounts are available,
    // eth_accounts will return an empty array.
    console.error(err);
  });

// Note that this event is emitted on page load.
// If the array of accounts is non-empty, you're already
// connected.
ethereum.on('accountsChanged', handleAccountsChanged);

// For now, 'eth_accounts' will continue to always return an array
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    // Do any other work!
  }
}

// While you are awaiting the call to eth_requestAccounts, you should disable
// any buttons the user can click to initiate the request.
// MetaMask will reject any additional requests while the first is still
// pending.
function connect() {
  console.log('connect');
  ethereum
    .request({ method: 'eth_requestAccounts' })
    .then(handleAccountsChanged)
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
}


App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: 'http://127.0.0.1:9545',
  currentAccount:null,
  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
        // Is there is an injected web3 instance?
    if (typeof provider !== 'undefined') {
      console.log('SETTING PROVIDER...');
      App.web3Provider = provider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('KittyFight.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var fightArtifact = data;
      App.contracts.fight = TruffleContract(fightArtifact);

      // Set the provider for our contract
      App.contracts.fight.setProvider(App.web3Provider);

      App.contracts.fight.web3.eth.defaultAccount = App.contracts.fight.web3.eth.coinbase;

      return App.bindEvents();
    });
  },



  bindEvents: function() {
    $(document).on('click', '.btn-load', App.handleLoad);
    $(document).on('click', '#fight', App.handleFight);
  },

  handleLoad: function(event) {
    event.preventDefault();
    let div = $(event.target).parent();
    let id = div.find('input').val();
    let img = div.parent().find('img');
    let challenger = ($(event.target).data('kitty') == 'challenger');

    if (!id) {
      img.prop('src', 'images/kitty-eth.svg');
      return;
    }

    web3.eth.getAccounts(function(error, accounts) {
      var account = accounts[0];

      App.contracts.fight.deployed().then(function(instance) {
        return instance.owns(account, id);
      }).then(function(result){
        if (challenger) {
          if (result) {
            $(event.target).data('valid', true);
          } else {
            $(event.target).data('valid', false);
          }
        } else {
          $(event.target).data('valid', true);
        }

        let nameBox;
        let gestatingBox;
        let statsBox;
        if (challenger) {
          nameBox = $('#challenger-name');
          gestatingBox = $('#challenger-gestating');
          statsBox = $('#challenger-stats');
        } else {
          nameBox = $('#opponent-name');
          gestatingBox = $('#opponent-gestating');
          statsBox = $('#opponent-stats');
        }

        $.getJSON('https://api.cryptokitties.co/v3/kitties/'+id, function(data) {
          img.prop('src', data.image_url);
          nameBox.text(data.name);

          if (data.is_gestating) {
            gestatingBox.show();
            $(event.target).data('valid', false);
          } else {
            gestatingBox.hide();
          }
        });

        App.updateStats(statsBox, id);

      }).catch(function(err){
        jQuery('#showmessage-text').html('Error loading kitty');
        jQuery('#show-event').animate({'right':'10px'});
        setTimeout(function(){jQuery('#show-event').animate({'right':'-410px'},500)}, 15000);

        $(event.target).data('valid', false);
      }).finally(function() {
        if ($('#challenger-load').data('valid') && $('#opponent-load').data('valid')) {
          $('#fight').prop('disabled', false);
        } else {
          $('#fight').prop('disabled', true);
        }
      });
    });
  },

  updateStats : function(statsBox, id) {
    App.contracts.fight.deployed().then(function(instance) {
      return instance.stats(id);
    }).then(function(result){
      statsBox.text(result[0].c[0]+' wins - '+result[2].c[0]+' draws - '+result[1].c[0]+' losses');
    });
  },

  resultText : function(result) {
      let challengerName = $('#challenger-name').text();
      let opponentName = $('#opponent-name').text();
      let resultText;

      if (result == 0) {
        resultText = challengerName + ' wins';
      } else if (result == 1) {
        resultText = opponentName + ' wins';
      } else {
        resultText = 'Draw';
      }
      return resultText;
  },

  handleFight : function() {
    let challengerId = $('#challenger-id').val();
    let opponentId = $('#opponent-id').val();
    $('#fight').prop('disabled', true);
    App.contracts.fight.deployed().then(function(instance) {
      return instance.fight(challengerId, opponentId);
    }).then(function(result){
      let log = result.logs[0];

      let round1ResultText = App.resultText(log.args.round1.c[0]);
      let round2ResultText = App.resultText(log.args.round2.c[0]);
      let round3ResultText = App.resultText(log.args.round3.c[0]);
      let fightResultText = App.resultText(log.args.game.c[0]) + '!';

      let challengerName = $('#challenger-name').text();
      let opponentName = $('#opponent-name').text();

      $('#kight-modal .modal-title').text(challengerName + ' vs ' + opponentName);
      $('#kight-modal .close').hide();
      $('#kight-modal').modal();

      let round1Number = $('#kight-modal .fight-round-number');
      round1Number.text('Round 1');
      setTimeout(function(){round1Number.animate({'font-size':'30px'});}, 3000);
      let round1Result = $('#kight-modal .fight-round-result');
      round1Result.css('font-size','140px');
      setTimeout(function(){round1Result.text('Fight!');}, 4000);
      setTimeout(function(){
        round1Result.css('font-size','80px');
        round1Result.text(round1ResultText);
      },7000);
      setTimeout(function(){round1Result.animate({'font-size':'30px'});}, 9000);

      let round2Number = $('#kight-modal .fight-round-number').clone();
      round2Number.text('Round 2');
      setTimeout(function(){round2Number.appendTo('#kight-modal .modal-body');},11000);
      setTimeout(function(){round2Number.animate({'font-size':'30px'});}, 13000);
      let round2Result = $('#kight-modal .fight-round-result').clone();
      round2Result.text('Fight!');
      setTimeout(function(){round2Result.appendTo('#kight-modal .modal-body');},15000);
      setTimeout(function(){
        round2Result.css('font-size','80px');
        round2Result.text(round2ResultText);
      },18000);
      setTimeout(function(){round2Result.animate({'font-size':'30px'});}, 20000);

      let round3Number = $('#kight-modal .fight-round-number').clone();
      round3Number.text('Round 3');
      setTimeout(function(){round3Number.appendTo('#kight-modal .modal-body');},22000);
      setTimeout(function(){round3Number.animate({'font-size':'30px'});}, 24000);
      let round3Result = $('#kight-modal .fight-round-result').clone();
      round3Result.text('Fight!');
      setTimeout(function(){round3Result.appendTo('#kight-modal .modal-body');},26000);
      setTimeout(function(){
        round3Result.css('font-size','80px');
        round3Result.text(round3ResultText);
      },29000);
      setTimeout(function(){round3Result.animate({'font-size':'30px'});}, 31000);

      setTimeout(function(){
        round1Number.hide();
        round2Number.remove();
        round3Number.remove();
        round1Result.text('');
        round2Result.remove();
        round3Result.remove();
        round1Number.text(fightResultText);
        round1Number.show();
        round1Number.animate({'font-size':'100px'});
        App.updateStats($('#challenger-stats'), $('#challenger-id').val());
        App.updateStats($('#opponent-stats'), $('#opponent-id').val());
        $('#kight-modal .close').show();
      },33000);

    }).catch(function(err){
      jQuery('#showmessage-text').html(err.message);
      jQuery('#show-event').animate({'right':'10px'});
      setTimeout(function(){jQuery('#show-event').animate({'right':'-410px'},500)}, 15000);
    }).finally(function() {
      $('#fight').prop('disabled', false);
    })
  }
};

function showModal() {
        $('#kight-modal .modal-title').text($('#challenger-name').text() + ' vs ' + $('#opponent-name').text());
      $('#kight-modal').modal();

      let round1Number = $('#kight-modal .fight-round-number');
      round1Number.text('Round 1');
      setTimeout(function(){round1Number.animate({'font-size':'30px'});}, 3000);
      let round1Result = $('#kight-modal .fight-round-result');
      setTimeout(function(){round1Result.text('Fight!');}, 4000);
      setTimeout(function(){
        round1Result.css('font-size','80px');
        round1Result.text('Kitty 1 wins');
      },7000);
      setTimeout(function(){round1Result.animate({'font-size':'30px'});}, 9000);

      let round2Number = $('#kight-modal .fight-round-number').clone();
      round2Number.text('Round 2');
      setTimeout(function(){round2Number.appendTo('#kight-modal .modal-body');},11000);
      setTimeout(function(){round2Number.animate({'font-size':'30px'});}, 13000);
      let round2Result = $('#kight-modal .fight-round-result').clone();
      round2Result.text('Fight!');
      setTimeout(function(){round2Result.appendTo('#kight-modal .modal-body');},15000);
      setTimeout(function(){
        round2Result.css('font-size','80px');
        round2Result.text('Kitty 2 wins');
      },18000);
      setTimeout(function(){round2Result.animate({'font-size':'30px'});}, 20000);

      let round3Number = $('#kight-modal .fight-round-number').clone();
      round3Number.text('Round 3');
      setTimeout(function(){round3Number.appendTo('#kight-modal .modal-body');},22000);
      setTimeout(function(){round3Number.animate({'font-size':'30px'});}, 24000);
      let round3Result = $('#kight-modal .fight-round-result').clone();
      round3Result.text('Fight!');
      setTimeout(function(){round3Result.appendTo('#kight-modal .modal-body');},26000);
      setTimeout(function(){
        round3Result.css('font-size','80px');
        round3Result.text('Kitty 2 wins');
      },29000);
      setTimeout(function(){round3Result.animate({'font-size':'30px'});}, 31000);

      setTimeout(function(){
        round1Number.hide();
        round2Number.hide();
        round3Number.hide();
        round1Result.hide();
        round2Result.hide();
        round3Result.hide();
        round1Number.text('Kitty 1 wins!');
        round1Number.show();
        round1Number.animate({'font-size':'140px'});
      },33000);
}

$(function() {
  $(window).load(function() {
    $('#connect-button').on('click', connect);
  });
});

