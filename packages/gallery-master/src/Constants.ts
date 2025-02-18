/*
* Model Resources
* */
export const COLLISION_SCENE_URL = new URL("./assets/models/scene_collision.glb", import.meta.url).href;
export const STATIC_SCENE_URL = new URL("./assets/models/scene_desk_obj.glb", import.meta.url).href;

/*
* Texture Resources - Now dynamically loaded from MongoDB
* */
// We'll keep the URL array but populate it dynamically
export let BOARD_TEXTURES: string[] = [];

/*
* Audio Resources
* */
export const AUDIO_URL = new URL("./assets/audio/我记得.m4a", import.meta.url).href;

/*
* Intro - Now dynamically loaded from MongoDB
* */
export let BOARDS_INFO: Record<string, {title: string, author: string, describe: string}> = {};

// Function to fetch and update NFT data from MongoDB
export async function initializeNFTData() {
    try {
        console.log('Fetching NFT data...');
        
        // 首先测试连接
        const testResponse = await fetch('/api/test');
        const testData = await testResponse.json();
        console.log('API test response:', testData);

        if (!testResponse.ok) {
            throw new Error(`API test failed: ${JSON.stringify(testData)}`);
        }

        const response = await fetch('/api/nfts');
        console.log('NFT response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
        }
        
        const nfts = await response.json();
        console.log('Received NFTs:', nfts);
        
        if (!Array.isArray(nfts) || nfts.length === 0) {
            console.warn('No NFTs received from server');
            return;
        }

        // Update BOARD_TEXTURES with images from MongoDB
        BOARD_TEXTURES = nfts.map((nft: any) => nft.image);
        console.log('Updated BOARD_TEXTURES:', BOARD_TEXTURES);
        
        // Update BOARDS_INFO with NFT data
        BOARDS_INFO = nfts.reduce((acc: any, nft: any, index: number) => {
            acc[index + 1] = {
                title: nft.name,
                author: nft.owner,
                describe: nft.description
            };
            return acc;
        }, {});
        console.log('Updated BOARDS_INFO:', BOARDS_INFO);
        
    } catch (error) {
        console.error('Failed to fetch NFT data:', error);
    }
}

/*
* Computer Iframe SRC
* */
export const IFRAME_SRC = new URL("/universe/index.html", import.meta.url).href;

/*
* Events
* */
export const ON_LOAD_PROGRESS = "on-load-progress";
export const ON_LOAD_MODEL_FINISH = "on-load-model-finish";
export const ON_CLICK_RAY_CAST = "on-click-ray-cast";
export const ON_SHOW_TOOLTIP = "on-show-tooltip";
export const ON_HIDE_TOOLTIP = "on-hide-tooltip";
export const ON_KEY_DOWN = "on-key-down";
export const ON_KEY_UP = "on-key-up";
export const ON_ENTER_APP = "on-enter-app";
