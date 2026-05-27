const Blockchain = require('./src/blockchain/blockchain');
const Wallet = require('./src/wallet/wallet');
const UTXOPool = require('./src/wallet/utxoPool');
const Transaction = require('./src/wallet/transaction');
const { MINING_REWARD } = require('./src/utils/config');

const utxoPool = new UTXOPool();
const blockchain = new Blockchain(utxoPool);
const wallet1 = new Wallet();
const wallet2 = new Wallet();

console.log("Testing BlockJS Improvements\n");

// Test Validation
let tx1 = Transaction.createTransaction({ senderWallet: wallet1, outputPublicKey: wallet2.publicKey, amount: 10, fee: 1 });
console.log("Tx valid without balance?:", utxoPool.isValidTransaction(tx1) === false ? "PASS" : "FAIL"); 

// Add balance manually for test
utxoPool.addUTXO(wallet1.publicKey, 100);
console.log("Tx valid with balance?:", utxoPool.isValidTransaction(tx1) === true ? "PASS" : "FAIL");

// Test Mining
let block1 = blockchain.addBlock({ transactions: [tx1, Transaction.rewardTransaction({ minerWallet: wallet2 })] });
console.log("\nBlock 1 mined!");
console.log("Difficulty:", block1.difficulty);

console.log("\nWallet Balances:");
console.log("Wallet 1 (Sender):", utxoPool.utxos[wallet1.publicKey], "expected: 89");
console.log("Wallet 2 (Recipient/Miner):", utxoPool.utxos[wallet2.publicKey], "expected:", 10 + MINING_REWARD + 1); // 10 amt + 12.5 reward + 1 fee

// Test DDA
console.log("\nMining Block 2 to test DDA...");
let block2 = blockchain.addBlock({ transactions: [] });
console.log("Block 2 Difficulty:", block2.difficulty);
