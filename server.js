// server.js

const Blockchain = require('./src/blockchain/blockchain');
const Wallet = require('./src/wallet/wallet');
const UTXOPool = require('./src/wallet/utxoPool');
const P2PNetwork = require('./src/network/p2p');
const createAPI = require('./src/network/api');
const Database = require('./src/utils/database');

async function startNode() {
    // 1. Initialize the Core Components from Disk
    const loadedChain = await Database.loadChain();
    const loadedUtxos = await Database.loadUTXOPool();

    const utxoPool = new UTXOPool(loadedUtxos || {});
    const blockchain = new Blockchain(utxoPool);
    
    if (loadedChain) {
        blockchain.chain = loadedChain;
        console.log(`📦 Loaded Blockchain from LevelDB. Chain length: ${blockchain.chain.length}`);
    } else {
        console.log('🌱 No existing blockchain found. Starting from Genesis Block.');
    }
    
    const wallet = new Wallet();
    const transactionPool = []; // The Mempool (Pending Transactions)

    // 2. Initialize the Network Layers
    const p2pNetwork = new P2PNetwork(blockchain, transactionPool);
    const app = createAPI(blockchain, wallet, transactionPool, p2pNetwork);

    // 3. Define Ports (Allows environment variables for running multiple nodes)
    const HTTP_PORT = process.env.HTTP_PORT || 3000;
    const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

    // 4. Start the HTTP Express Server
    const httpServer = app.listen(HTTP_PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 BlockJS Node running on port: ${HTTP_PORT}`);
        console.log(`🔑 Node Public Address: ${wallet.publicKey.substring(0, 20)}...`);
        console.log(`======================================================\n`);
    });

    // 5. Start the Socket.io Server and Connect to Peers
    p2pNetwork.listen(httpServer);

    if (PEERS.length > 0) {
        console.log(`🔗 Connecting to peers: ${PEERS}`);
        p2pNetwork.connectToPeers(PEERS);
    }
}

startNode();