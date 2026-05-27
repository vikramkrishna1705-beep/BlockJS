// src/network/api.js

const express = require('express');
const Transaction = require('../wallet/transaction');

/**
 * Creates and configures the Express API router.
 */
function createAPI(blockchain, wallet, transactionPool, p2pNetwork) {
    const app = express();
    app.use(express.json()); // Allows us to parse JSON bodies

    // View the current state of the blockchain
    app.get('/blocks', (req, res) => {
        res.json(blockchain.chain);
    });

    // View pending transactions in the mempool
    app.get('/mempool', (req, res) => {
        res.json(transactionPool);
    });

    // Get the public key (address) of this node's wallet
    app.get('/address', (req, res) => {
        res.json({ address: wallet.publicKey });
    });

    // Create a new transaction
    app.post('/transact', (req, res) => {
        const { outputPublicKey, amount, fee } = req.body;

        try {
            // 1. Create and sign the transaction
            const transaction = Transaction.createTransaction({
                senderWallet: wallet,
                outputPublicKey,
                amount,
                fee
            });

            if (!blockchain.utxoPool.isValidTransaction(transaction)) {
                return res.status(400).json({ error: 'Invalid transaction: insufficient funds or invalid signature.' });
            }

            // 2. Add it to our local mempool
            transactionPool.push(transaction);

            // 3. Broadcast it to the rest of the P2P network
            p2pNetwork.broadcastTransaction(transaction);

            res.json({ message: 'Transaction successfully created and broadcasted.', transaction });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Mine the pending transactions into a new block
    app.get('/mine', async (req, res) => {
        // 1. Include the reward for the miner
        const validTransactions = [...transactionPool, Transaction.rewardTransaction({ minerWallet: wallet })];

        // 2. Add block to the chain (Proof of Work happens here)
        const newBlock = await blockchain.addBlock({ transactions: validTransactions });

        // 2. Broadcast the updated chain to peers
        p2pNetwork.broadcastChain();

        // 3. Clear confirmed transactions from the local mempool
        p2pNetwork.clearConfirmedTransactions();
        p2pNetwork.broadcastClearMempool();

        res.json({ message: 'Block successfully mined!', block: newBlock });
    });

    return app;
}

module.exports = createAPI;