import { NextRequest } from 'next/server';
import * as NFTService from '../../../services/mongoDB/api';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  switch (action) {
    case 'mint':
      return NFTService.mintNFT(request);
    case 'updateShelf':
      return NFTService.updateNFTShelf(request);
    case 'purchase':
      return NFTService.purchaseNFT(request);
    case 'favorite':
      return NFTService.addFavorite(request);
    case 'report':
      return NFTService.reportNFT(request);
    default:
      return NFTService.mintNFT(request);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const query = searchParams.get('q');
  const address = searchParams.get('address');
  const nftId = searchParams.get('nftId');

  switch (action) {
    case 'listed':
      return NFTService.getListedNFTs();
    case 'user':
      return address ? NFTService.getUserNFTs(address) : NFTService.getNFTs();
    case 'favorites':
      return NFTService.getFavorites();
    case 'check':
      return nftId ? NFTService.checkNFTExists(nftId) : NFTService.getNFTs();
    case 'search':
      return query ? NFTService.searchNFTs(query) : NFTService.getNFTs();
    default:
      return NFTService.getNFTs();
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const nftId = searchParams.get('nftId');

  if (nftId) {
    return NFTService.removeFavorite(nftId);
  }

  return new Response('Missing nftId', { status: 400 });
}