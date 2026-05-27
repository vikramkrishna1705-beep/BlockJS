const Blockchain = require('./blockchain');
const Block = require('./block');
const { cryptoHash } = require('../utils/crypto');
const UTXOPool = require('../wallet/utxoPool');

jest.mock('../utils/database', () => ({
    saveChain: jest.fn(),
    loadChain: jest.fn(),
    saveUTXOPool: jest.fn(),
    loadUTXOPool: jest.fn()
}));

describe('Blockchain', () => {
    let blockchain, newChain, originalChain, errorMock, utxoPool;

    beforeEach(() => {
        utxoPool = new UTXOPool();
        blockchain = new Blockchain(utxoPool);
        newChain = new Blockchain(new UTXOPool());
        errorMock = jest.fn();
        global.console.log = jest.fn();
        global.console.error = errorMock;
    });

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new block to the chain', async () => {
        const newData = [];
        await blockchain.addBlock({ transactions: newData });
        expect(blockchain.chain[blockchain.chain.length - 1].transactions).toEqual(newData);
    });

    describe('isValidChain()', () => {
        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' };
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with the genesis block and has multiple blocks', () => {
            beforeEach(async () => {
                await blockchain.addBlock({ transactions: [] });
                await blockchain.addBlock({ transactions: [] });
                await blockchain.addBlock({ transactions: [] });
            });

            describe('and a previousHash reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].previousHash = 'broken-hash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].transactions = [{ fake: 'data' }];
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with a jumped difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const transactions = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(lastBlock.index + 1, timestamp, lastHash, transactions, nonce, difficulty);
                    
                    const badBlock = new Block({ index: lastBlock.index + 1, timestamp, previousHash: lastHash, hash, nonce, difficulty, transactions });
                    blockchain.chain.push(badBlock);

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain does not contain any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()', () => {
        describe('when the new chain is not longer', () => {
            it('does not replace the chain', async () => {
                newChain.chain[0] = { new: 'chain' };
                await blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(blockchain.chain);
            });
        });

        describe('when the new chain is longer', () => {
            beforeEach(async () => {
                await newChain.addBlock({ transactions: [] });
                await newChain.addBlock({ transactions: [] });
                await newChain.addBlock({ transactions: [] });
            });

            describe('and the chain is invalid', () => {
                it('does not replace the chain', async () => {
                    newChain.chain[2].hash = 'some-fake-hash';
                    await blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).not.toEqual(newChain.chain);
                });
            });

            describe('and the chain is valid', () => {
                it('replaces the chain', async () => {
                    await blockchain.replaceChain(newChain.chain);
                    expect(blockchain.chain).toEqual(newChain.chain);
                });
            });
        });
    });
});
