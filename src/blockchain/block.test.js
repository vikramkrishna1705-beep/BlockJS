const Block = require('./block');
const { GENESIS_DATA, MINE_RATE } = require('../utils/config');
const { cryptoHash } = require('../utils/crypto');
const { calculateMerkleRoot } = require('../utils/merkle');

describe('Block', () => {
    let lastBlock, data, minedBlock;

    beforeEach(() => {
        lastBlock = Block.genesis();
        data = [{ amount: 10 }];
        minedBlock = Block.mineBlock({ lastBlock, transactions: data });
    });

    it('has a timestamp, lastHash, hash, and data property', () => {
        expect(minedBlock.timestamp).not.toEqual(undefined);
        expect(minedBlock.previousHash).toEqual(lastBlock.hash);
        expect(minedBlock.hash).not.toEqual(undefined);
        expect(minedBlock.transactions).toEqual(data);
    });

    describe('mineBlock()', () => {
        it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
            expect(minedBlock.previousHash).toEqual(lastBlock.hash);
        });

        it('sets the `transactions`', () => {
            expect(minedBlock.transactions).toEqual(data);
        });

        it('sets a `timestamp`', () => {
            expect(minedBlock.timestamp).not.toEqual(undefined);
        });

        it('creates a SHA-256 `hash` based on the proper inputs', () => {
            expect(minedBlock.hash).toEqual(
                cryptoHash(
                    minedBlock.index,
                    minedBlock.timestamp,
                    lastBlock.hash,
                    minedBlock.merkleRoot,
                    minedBlock.nonce,
                    minedBlock.difficulty
                )
            );
        });

        it('sets a `hash` that matches the difficulty criteria', () => {
            expect(minedBlock.hash.substring(0, minedBlock.difficulty)).toEqual('0'.repeat(minedBlock.difficulty));
        });

        it('adjusts the difficulty', () => {
            const possibleResults = [lastBlock.difficulty + 1, lastBlock.difficulty - 1];
            expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
        });
    });

    describe('adjustDifficulty()', () => {
        it('raises the difficulty for a quickly mined block', () => {
            expect(Block.adjustDifficulty({
                originalBlock: lastBlock, timestamp: lastBlock.timestamp + MINE_RATE - 100
            })).toEqual(lastBlock.difficulty + 1);
        });

        it('lowers the difficulty for a slowly mined block', () => {
            expect(Block.adjustDifficulty({
                originalBlock: lastBlock, timestamp: lastBlock.timestamp + MINE_RATE + 100
            })).toEqual(lastBlock.difficulty - 1);
        });

        it('has a lower limit of 1', () => {
            lastBlock.difficulty = -1;
            expect(Block.adjustDifficulty({ originalBlock: lastBlock, timestamp: Date.now() })).toEqual(1);
        });
    });
});
