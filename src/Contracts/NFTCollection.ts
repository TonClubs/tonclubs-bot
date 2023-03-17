import fs from 'node:fs';
import {join} from 'node:path';
import {Address, Cell, contractAddress, beginCell, BitString, storeStateInit} from 'ton-core';

const BOCsDir = join(__dirname, './BOCs');

const NFTCollectionCodeCell = Cell.fromBoc(fs.readFileSync(join(BOCsDir, 'nft-collection.boc')))[0];
const NFTItemCodeCell = Cell.fromBoc(fs.readFileSync(join(BOCsDir, 'nft-item.boc')))[0];

const getBitStringFromUrl = (url: string): BitString => {
  const buffer = Buffer.from(new TextEncoder().encode(encodeURI(url)).buffer);
  return new BitString(buffer, 0, buffer.length * 8);
};

const getCollectionContentCell = (url: string): Cell => {
  return beginCell().storeUint(0x01, 8).storeBits(getBitStringFromUrl(url)).endCell();
};

const getCommonContentCell = (url: string): Cell => {
  return beginCell().storeBits(getBitStringFromUrl(url)).endCell();
};

export default class NFTCollection {
  public static getDeployData(options: {
    owner: Address;
    collectionContentUrl: string;
    commonContentUrl: string;
    price?: number;
    limit?: number;
  }): {
    address: Address;
    code: Cell;
    data: Cell;
    stateInit: Cell;
  } {
    const royaltyParams = beginCell()
      .storeUint(50, 16) // royalty factor
      .storeUint(1000, 16) // royalty base
      .storeAddress(options.owner) // royalty receiver
      .endCell();

    const contentCell = beginCell()
      .storeRef(getCollectionContentCell(options.collectionContentUrl))
      .storeRef(getCommonContentCell(options.commonContentUrl))
      .endCell();

    const data = beginCell()
      .storeAddress(options.owner) // owner address
      .storeUint(0, 64) // next item index
      .storeUint(options.limit || 0xffffffffffffffffn, 64) // limit
      .storeUint((options.price || 0) * 1000, 64) // price -- 50000000 = 0.05 TON
      .storeRef(contentCell) // content cell
      .storeRef(NFTItemCodeCell) // code cell
      .storeRef(royaltyParams) // royalty params cell
      .endCell();

    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, {code: NFTCollectionCodeCell, data});

    const stateInit = beginCell()
      .store(storeStateInit({code: NFTCollectionCodeCell, data}))
      .endCell();

    return {
      address,
      code: NFTCollectionCodeCell,
      data,
      stateInit,
    };
  }

  public static getMintData(options: {owner: Address}): Cell {
    const nftUriCell = beginCell().storeBits(getBitStringFromUrl('')).endCell();

    const nftItemContentCell = beginCell()
      .storeAddress(options.owner)
      .storeRef(nftUriCell)
      .endCell();

    return beginCell()
      .storeUint(1, 32) // op (op #1 = mint)
      .storeUint(0, 64) // query id
      .storeCoins(50000000)
      .storeRef(nftItemContentCell)
      .endCell();
  }
}
