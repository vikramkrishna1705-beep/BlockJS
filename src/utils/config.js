// src/utils/config.js

// The number of leading zeros required for a valid hash.
// Higher number = exponentially harder to mine.
const INITIAL_DIFFICULTY = 3;

// The target time in milliseconds for mining a block
const MINE_RATE = 3000;

// The amount of new coins generated and awarded to the miner of a block.
const MINING_REWARD = 12.5;

// The hardcoded first block of the blockchain.
const GENESIS_DATA = {
    index: 0,
    timestamp: 1, // Fixed timestamp for genesis
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    merkleRoot: '',
    hash: 'genesis-hash',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    transactions: [] // Empty for the genesis block
};

module.exports = {
    INITIAL_DIFFICULTY,
    MINE_RATE,
    MINING_REWARD,
    GENESIS_DATA
};