// src/wallet/transaction.js

const { MINING_REWARD } = require('../utils/config');
const { cryptoHash, verifySignature } = require('../utils/crypto');

class Transaction {
    constructor({ inputPublicKey, outputPublicKey, amount, fee = 0, signature }) {
        this.inputPublicKey = inputPublicKey;
        this.outputPublicKey = outputPublicKey;
        this.amount = amount;
        this.fee = fee;
        this.signature = signature;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return cryptoHash(this.inputPublicKey, this.outputPublicKey, this.amount, this.fee);
    }

    /**
     * Verifies that the transaction was truly signed by the owner of the input funds.
     */
    hasValidSignature() {
        if (this.inputPublicKey === '*authorized-reward*') return true;
        if (!this.signature) return false;

        return verifySignature({
            publicKey: this.inputPublicKey,
            dataHash: cryptoHash(this.hash),
            signature: this.signature
        });
    }

    /**
     * Factory helper function to instantiate and sign a transaction simultaneously.
     */
    static createTransaction({ senderWallet, outputPublicKey, amount, fee = 0 }) {
        const transaction = new this({
            inputPublicKey: senderWallet.publicKey,
            outputPublicKey,
            amount,
            fee
        });

        // Generate the digital signature (converted to standard DER hex format)
        transaction.signature = senderWallet.sign(transaction.hash).toDER('hex');

        return transaction;
    }

    /**
     * Factory helper function to create a reward transaction for the miner.
     */
    static rewardTransaction({ minerWallet }) {
        return new this({
            inputPublicKey: '*authorized-reward*',
            outputPublicKey: minerWallet.publicKey,
            amount: MINING_REWARD,
            fee: 0,
            signature: null // No signature needed for coinbase/reward
        });
    }
}

module.exports = Transaction;