// src/blockchain/block.js

const { GENESIS_DATA, MINE_RATE } = require('../utils/config');
const { cryptoHash } = require('../utils/crypto');

class Block {
    constructor({ index, timestamp, previousHash, hash, transactions, nonce, difficulty }) {
        this.index = index;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.hash = hash;
        this.transactions = transactions; // Array of transaction objects
        this.nonce = nonce;
        this.difficulty = difficulty;
    }

    /**
     * Generates the hardcoded Genesis block.
     */
    static genesis() {
        return new this(GENESIS_DATA);
    }

    /**
     * Adjusts the difficulty dynamically based on how quickly the block was mined.
     */
    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;

        if (difficulty < 1) return 1;

        if ((timestamp - originalBlock.timestamp) > MINE_RATE) {
            return difficulty - 1;
        }

        return difficulty + 1;
    }

    /**
     * The Proof-of-Work algorithm.
     * Continuously increments a nonce and hashes the block until the resulting 
     * hash meets the difficulty requirement (starts with N zeros).
     */
    static mineBlock({ lastBlock, transactions }) {
        let hash, timestamp;
        const previousHash = lastBlock.hash;
        const index = lastBlock.index + 1;
        let { difficulty } = lastBlock;
        let nonce = 0;

        // The Mining Loop
        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(index, timestamp, previousHash, transactions, nonce, difficulty);
        } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

        return new this({
            index,
            timestamp,
            previousHash,
            transactions,
            nonce,
            difficulty,
            hash
        });
    }
}

module.exports = Block;