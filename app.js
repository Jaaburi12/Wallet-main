let stellarKeypair;
let bscWallet;
const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');

document.getElementById('generate-wallet').addEventListener('click', () => {
  // Stellar Wallet
  stellarKeypair = StellarSdk.Keypair.random();
  document.getElementById('stellar-secret').textContent = stellarKeypair.secret();

  // BSC Wallet
  bscWallet = ethers.Wallet.createRandom();
  document.getElementById('bsc-key').textContent = bscWallet.privateKey;

  alert('Wallets Generated! Please backup your keys securely.');
});

document.getElementById('check-balances').addEventListener('click', async () => {
  if (!stellarKeypair || !bscWallet) return alert('Generate wallets first!');

  // Stellar
  const server = new StellarSdk.Server('https://horizon.stellar.org');
  try {
    const account = await server.loadAccount(stellarKeypair.publicKey());
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')?.balance || '0';
    document.getElementById('xlm-balance').textContent = xlmBalance;
  } catch (e) {
    document.getElementById('xlm-balance').textContent = '0';
  }

  // BSC
  const walletConnected = bscWallet.connect(provider);
  const bnbBalance = await walletConnected.getBalance();
  document.getElementById('bnb-balance').textContent = ethers.formatEther(bnbBalance);
});

document.getElementById('send-btn').addEventListener('click', async () => {
  const chain = document.getElementById('send-chain').value;
  const recipient = document.getElementById('recipient').value;
  const amount = document.getElementById('amount').value;

  const statusEl = document.getElementById('send-status');
  statusEl.textContent = 'Sending...';

  try {
    if (chain === 'XLM') {
      const server = new StellarSdk.Server('https://horizon.stellar.org');
      const account = await server.loadAccount(stellarKeypair.publicKey());
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.PUBLIC
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: recipient,
          asset: StellarSdk.Asset.native(),
          amount: amount.toString()
        }))
        .setTimeout(30)
        .build();
      tx.sign(stellarKeypair);
      await server.submitTransaction(tx);
      statusEl.textContent = 'XLM Sent!';
    } else if (chain === 'BSC') {
      const walletConnected = bscWallet.connect(provider);
      const tx = await walletConnected.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      statusEl.textContent = 'BNB Sent!';
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Transaction Failed!';
  }
});
