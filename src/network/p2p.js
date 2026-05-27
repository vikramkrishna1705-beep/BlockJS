// src/network/p2p.js

const { Server } = require('socket.io');
const { io } = require('socket.io-client');

class P2PNetwork {
    constructor(blockchain, transactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool; // The "Mempool" for pending transactions
        this.sockets = [];
    }

    /**
     * Starts the Socket.io server to listen for incoming connections from other nodes.
     */
    listen(httpServer) {
        const server = new Server(httpServer, { cors: { origin: '*' } });

        server.on('connection', (socket) => this.initConnection(socket));
        console.log('🔌 P2P WebSocket Server initialized');
    }

    /**
     * Connects to a list of existing peer URLs (e.g., ['ws://localhost:3001']).
     */
    connectToPeers(peers) {
        peers.forEach(peer => {
            const socket = io(peer);
            socket.on('connect', () => this.initConnection(socket));
        });
    }

    initConnection(socket) {
        this.sockets.push(socket);
        this.handleMessages(socket);

        // Immediately send the new node our current version of the blockchain
        socket.emit('SYNC_CHAIN', this.blockchain.chain);
    }

    /**
     * Listens for incoming network events.
     */
    handleMessages(socket) {
        // Another node has mined a block or synced with us
        socket.on('SYNC_CHAIN', async (newChain) => {
            if (await this.blockchain.replaceChain(newChain)) {
                this.clearConfirmedTransactions();
            }
        });

        // Another node has broadcast a new transaction
        socket.on('BROADCAST_TRANSACTION', (transaction) => {
            const exists = this.transactionPool.find(t => t.hash === transaction.hash);
            if (!exists) {
                this.transactionPool.push(transaction);
            }
        });

        // A block was mined, clear pending transactions
        socket.on('CLEAR_MEMPOOL', () => {
            this.clearConfirmedTransactions();
        });
    }

    clearConfirmedTransactions() {
        const confirmedTransactions = new Set();
        for (let block of this.blockchain.chain) {
            for (let tx of block.transactions) {
                confirmedTransactions.add(tx.hash);
            }
        }
        
        for (let i = this.transactionPool.length - 1; i >= 0; i--) {
            if (confirmedTransactions.has(this.transactionPool[i].hash)) {
                this.transactionPool.splice(i, 1);
            }
        }
    }

    // --- Broadcast Helpers ---

    broadcastChain() {
        this.sockets.forEach(socket => socket.emit('SYNC_CHAIN', this.blockchain.chain));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => socket.emit('BROADCAST_TRANSACTION', transaction));
    }

    broadcastClearMempool() {
        this.sockets.forEach(socket => socket.emit('CLEAR_MEMPOOL'));
    }
}

module.exports = P2PNetwork;