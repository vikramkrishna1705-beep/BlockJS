// src/wallet/wallet.js

const { ec, cryptoHash } = require('../utils/crypto');

class Wallet {
    constructor() {
        // Generate a new key pair when a wallet is created
        this.keyPair = ec.genKeyPair();

        // The public key acts as your public address to receive funds
        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    /**
     * Cryptographically signs data using the wallet's private key.
     */
    sign(data) {
        // We hash the data first, then sign the hash
        return this.keyPair.sign(cryptoHash(data));
    }
}

module.exports = Wallet;