const Wallet = require('./wallet');
const { verifySignature, cryptoHash } = require('../utils/crypto');

describe('Wallet', () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it('has a `publicKey`', () => {
        expect(wallet.publicKey).toBeDefined();
    });

    describe('signing data', () => {
        const data = 'foobar';

        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    dataHash: cryptoHash(data),
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('does not verify an invalid signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    dataHash: cryptoHash(data),
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });
});
