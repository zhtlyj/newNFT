import express from 'express';
const router = express.Router();

// GET /api/nfts - Get all NFTs
router.get('/nfts', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const collection = db.collection('NFTS');

        const nfts = await collection
            .find()
            .sort({ id: 1 })
            .project({ image: 1, name: 1, owner: 1, description: 1 })
            .toArray();

        if (nfts.length === 0) {
            return res.status(404).json({ error: 'No NFTs found' });
        }

        res.json(nfts);
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        res.status(500).json({ error: 'Failed to fetch NFTs' });
    }
});

// GET /api/test - Test database connection
router.get('/test', async (req, res) => {
    console.log('Test endpoint called');
    try {
        const db = req.app.locals.db;
        const collections = await db.listCollections().toArray();
        const nftsCollection = db.collection('NFTS');
        const count = await nftsCollection.countDocuments();

        const response = {
            status: 'connected',
            database: db.databaseName,
            collections: collections.map(c => c.name),
            nftCount: count
        };

        console.log('Test response:', response);
        res.json(response);
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

export default router; 