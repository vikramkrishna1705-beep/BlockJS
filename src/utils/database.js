const { Level } = require('level');
const db = new Level('./blockchain-db', { valueEncoding: 'json' });

class Database {
    static async saveChain(chain) {
        await db.put('chain', chain);
    }
    static async loadChain() {
        try {
            return await db.get('chain');
        } catch (error) {
            return null; // Not found
        }
    }
    static async saveUTXOPool(utxos) {
        await db.put('utxos', utxos);
    }
    static async loadUTXOPool() {
        try {
            return await db.get('utxos');
        } catch (error) {
            return null;
        }
    }
}

module.exports = Database;
