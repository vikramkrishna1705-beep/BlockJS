const blocksContainer = document.getElementById('blocksContainer');
const mempoolContainer = document.getElementById('mempoolContainer');
const blockCount = document.getElementById('blockCount');
const refreshBtn = document.getElementById('refreshBtn');

const API_URLS = {
    blocks: '/blocks',
    mempool: '/mempool' 
};

async function fetchData() {
    try {
        const [blocksRes, mempoolRes] = await Promise.all([
            fetch(API_URLS.blocks),
            fetch(API_URLS.mempool).catch(() => ({ json: () => [] }))
        ]);

        const blocks = await blocksRes.json();
        const mempool = await mempoolRes.json();

        renderBlocks(blocks);
        renderMempool(mempool);
    } catch (error) {
        console.error("Error fetching blockchain data:", error);
        blocksContainer.innerHTML = `<p style="color:red;">Failed to connect to the node API.</p>`;
    }
}

function renderBlocks(blocks) {
    blockCount.textContent = blocks.length;
    blocksContainer.innerHTML = ''; 
    
    [...blocks].reverse().forEach((block, index) => {
        const height = blocks.length - 1 - index;
        const blockDiv = document.createElement('div');
        blockDiv.className = 'block';
        
        blockDiv.innerHTML = `
            <h3>Block #${height} ${height === 0 ? '(Genesis)' : ''}</h3>
            <p><strong>Hash:</strong> <span class="hash">${block.hash}</span></p>
            <p><strong>Previous:</strong> <span class="hash">${block.previousHash || '0'}</span></p>
            <p><strong>Merkle Root:</strong> <span class="hash">${block.merkleRoot || 'N/A'}</span></p>
            <p><strong>Timestamp:</strong> ${new Date(block.timestamp).toLocaleString()}</p>
            <p><strong>Transactions:</strong> ${block.transactions.length}</p>
            <p><strong>Nonce:</strong> ${block.nonce}</p>
        `;
        blocksContainer.appendChild(blockDiv);
    });
}

function renderMempool(transactions) {
    mempoolContainer.innerHTML = '';
    
    const txArray = Array.isArray(transactions) ? transactions : transactions.pendingTransactions || [];

    if (!txArray || txArray.length === 0) {
        mempoolContainer.innerHTML = '<p>No pending transactions in the mempool.</p>';
        return;
    }

    txArray.forEach((tx, i) => {
        const txDiv = document.createElement('div');
        txDiv.className = 'tx';
        txDiv.innerHTML = `
            <h4>Pending Tx #${i + 1}</h4>
            <pre style="font-size: 0.85em; overflow-x: auto; margin:0;">${JSON.stringify(tx, null, 2)}</pre>
        `;
        mempoolContainer.appendChild(txDiv);
    });
}

refreshBtn.addEventListener('click', () => {
    refreshBtn.textContent = "Refreshing...";
    fetchData().then(() => {
        setTimeout(() => refreshBtn.textContent = "Refresh Data", 500);
    });
});

fetchData();
setInterval(fetchData, 10000);
