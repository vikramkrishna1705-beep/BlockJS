const crypto = require('crypto');

// Helper for SHA-256 hashing
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calculates the Merkle Root for an array of transactions.
 * @param {Array} transactions - Array of transactions (objects or strings)
 * @returns {string} The Merkle Root hash
 */
function calculateMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) {
        return '';
    }
    
    // Step 1: Get the hash of every transaction
    let hashes = transactions.map(tx => 
        typeof tx === 'string' ? tx : sha256(JSON.stringify(tx))
    );
    
    // Step 2: Iteratively hash pairs until only one hash (the root) remains
    while (hashes.length > 1) {
        // If there's an odd number of hashes, duplicate the last one
        if (hashes.length % 2 !== 0) {
            hashes.push(hashes[hashes.length - 1]);
        }
        
        const newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            // Concatenate pairs and hash them together
            newLevel.push(sha256(hashes[i] + hashes[i + 1]));
        }
        hashes = newLevel; // Move up the tree
    }
    
    return hashes[0];
}

module.exports = { calculateMerkleRoot, sha256 };
