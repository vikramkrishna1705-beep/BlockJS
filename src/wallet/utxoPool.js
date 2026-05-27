// src/wallet/utxoPool.js

class UTXOPool {
    constructor(utxos = {}) {
        // Maps public keys to their current available balance
        this.utxos = utxos;
    }

    addUTXO(publicKey, amount) {
        if (this.utxos[publicKey]) {
            this.utxos[publicKey] += amount;
        } else {
            this.utxos[publicKey] = amount;
        }
    }

    clear() {
        this.utxos = {};
    }

    clone() {
        // Returns a deep copy so we can simulate block additions without mutating the current state
        return new UTXOPool({ ...this.utxos });
    }

    isValidTransaction(transaction) {
        const { inputPublicKey, amount, fee } = transaction;
        
        if (inputPublicKey === '*authorized-reward*') return true;

        const totalCost = amount + fee;
        const senderBalance = this.utxos[inputPublicKey] || 0;

        if (senderBalance < totalCost || totalCost <= 0) return false;

        if (!transaction.hasValidSignature()) return false;

        return true;
    }

    handleTransaction(transaction, minerPublicKey) {
        const Transaction = require('./transaction');
        const tx = transaction instanceof Transaction ? transaction : new Transaction(transaction);

        if (!this.isValidTransaction(tx)) return false;

        const { inputPublicKey, outputPublicKey, amount, fee } = tx;

        if (inputPublicKey !== '*authorized-reward*') {
            this.utxos[inputPublicKey] -= (amount + fee);
            if (this.utxos[inputPublicKey] === 0) {
                delete this.utxos[inputPublicKey]; 
            }
            if (fee > 0 && minerPublicKey) {
                this.addUTXO(minerPublicKey, fee);
            }
        }

        this.addUTXO(outputPublicKey, amount);

        return true;
    }
}

module.exports = UTXOPool;