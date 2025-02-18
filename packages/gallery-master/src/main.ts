import Core from "./core";
import { initializeNFTData } from './Constants';

const core = new Core();

// Initialize NFT data before starting the app
await initializeNFTData();

core.render();
