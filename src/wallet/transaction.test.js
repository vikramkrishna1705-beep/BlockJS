const Transaction = require('./transaction');
const Wallet = require('./wallet');
const { MINING_REWARD } = require('../utils/config');

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount, fee;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;
        fee = 1;
        transaction = Transaction.createTransaction({ senderWallet, outputPublicKey: recipient, amount, fee });
    });

    it('has an `inputPublicKey`', () => {
        expect(transaction.inputPublicKey).toEqual(senderWallet.publicKey);
    });

    it('has an `outputPublicKey`', () => {
        expect(transaction.outputPublicKey).toEqual(recipient);
    });

    it('has an `amount` and `fee`', () => {
        expect(transaction.amount).toEqual(amount);
        expect(transaction.fee).toEqual(fee);
    });

    describe('hasValidSignature()', () => {
        it('returns true for a valid signature', () => {
            expect(transaction.hasValidSignature()).toBe(true);
        });

        it('returns false for an invalid signature', () => {
            transaction.amount = 9000;
            transaction.hash = transaction.calculateHash();
            expect(transaction.hasValidSignature()).toBe(false);
        });
    });

    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });

        it('creates a transaction with the reward input', () => {
            expect(rewardTransaction.inputPublicKey).toEqual('*authorized-reward*');
        });

        it('creates a transaction with the `MINING_REWARD`', () => {
            expect(rewardTransaction.amount).toEqual(MINING_REWARD);
        });
    });
});
