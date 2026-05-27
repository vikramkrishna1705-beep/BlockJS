// src/blockchain/blockchain.js

const Block = require('./block');
const { cryptoHash } = require('../utils/crypto');

class Blockchain {
    constructor(utxoPool) {
        this.chain = [Block.genesis()];
        this.utxoPool = utxoPool;
    }

    async addBlock({ transactions }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            transactions
        });

        // Update UTXO pool locally
        let minerPublicKey = null;
        const rewardTx = transactions.find(t => t.inputPublicKey === '*authorized-reward*');
        if (rewardTx) minerPublicKey = rewardTx.outputPublicKey;
        
        transactions.forEach(tx => {
            if (this.utxoPool) this.utxoPool.handleTransaction(tx, minerPublicKey);
        });

        this.chain.push(newBlock);

        const Database = require('../utils/database');
        await Database.saveChain(this.chain);
        if (this.utxoPool) await Database.saveUTXOPool(this.utxoPool.utxos);

        return newBlock;
    }

    static isValidChain(chain) {
        // 1. Validate the Genesis Block
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }

        const UTXOPool = require('../wallet/utxoPool');
        let tempPool = new UTXOPool();

        // 2. Validate every subsequent block
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const actualLastHash = chain[i - 1].hash;
            const { index, timestamp, previousHash, hash, transactions, nonce, difficulty } = block;

            // Check the chain link
            if (previousHash !== actualLastHash) return false;

            // Recalculate the hash to ensure no data (transactions) was tampered with
            const validatedHash = cryptoHash(index, timestamp, previousHash, transactions, nonce, difficulty);
            if (hash !== validatedHash) return false;

            // Enforce Dynamic Difficulty Adjustment rules (difficulty shouldn't jump by > 1)
            if (Math.abs(chain[i - 1].difficulty - difficulty) > 1) return false;

            let minerPublicKey = null;
            const rewardTx = transactions.find(t => t.inputPublicKey === '*authorized-reward*');
            if (rewardTx) minerPublicKey = rewardTx.outputPublicKey;

            for (let tx of transactions) {
                if (!tempPool.handleTransaction(tx, minerPublicKey)) {
                    return false;
                }
            }
        }

        return true;
    }

    async replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            console.log('Incoming chain is not longer. Chain rejected.');
            return false;
        }

        if (!Blockchain.isValidChain(newChain)) {
            console.log('Incoming chain is invalid. Chain rejected.');
            return false;
        }

        console.log('Replacing blockchain with incoming chain.');
        this.chain = newChain;

        // Rebuild UTXO Pool
        if (this.utxoPool) {
            this.utxoPool.clear();
            this.chain.forEach(block => {
                let minerPublicKey = null;
                const rewardTx = block.transactions.find(t => t.inputPublicKey === '*authorized-reward*');
                if (rewardTx) minerPublicKey = rewardTx.outputPublicKey;
                block.transactions.forEach(tx => this.utxoPool.handleTransaction(tx, minerPublicKey));
            });
        }

        const Database = require('../utils/database');
        await Database.saveChain(this.chain);
        if (this.utxoPool) await Database.saveUTXOPool(this.utxoPool.utxos);

        return true;
    }
}

module.exports = Blockchain;