import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

import { chainMap } from './utils/chainMap';
import getEvents from './utils/getEvents';
import getWithdrawEvents from './utils/getWithdrawEvents';
import getChainMap from './utils/getChainMap';
import { calculateTransferFee } from './utils/calculateTransferFee';

import { Block, BlockDocument } from './schemas/block.schema';
import { Migration, MigrationDocument } from './schemas/migration.schema';
import getSignatures from './utils/getSignatures';

const Web3 = require('web3');

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Block.name) private blockModel: Model<BlockDocument>,
    @InjectModel(Migration.name)
    private migrationModel: Model<MigrationDocument>,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  @Cron('*/30 * * * * *')
  async Receive() {
    try{
    const blocks = await this.blockModel.findById(process.env.BRIDGE_ID);
    const { events, ethNewBlock, bnbNewBlock } = await getEvents(blocks);
    console.log(events);
    
    if (events && events != undefined && events.length != 0) {
      for (const event of events) {

        console.log(">>>",event);

        console.log(Web3.utils.fromWei(event.returnValues.amount.toString(), 'gwei'));
        

        let signature = await getSignatures({
          sender: event.returnValues.from,
          receiver: event.returnValues.to,
          nonce: event.returnValues.nonce,
          amount: Web3.utils.fromWei(event.returnValues.amount.toString(), 'gwei'),
        });

        await this.migrationModel.findOneAndUpdate(
          { fromHash: event.transactionHash },
          {
            amount: Web3.utils.fromWei(event.returnValues.amount.toString(), 'gwei'),
  
            sender: event.returnValues.from,
            receiver: event.returnValues.to,
            fromChain: event.fromChain,
            toChain: event.toChain,
            fromHash: event.fromHash,
            nonce: event.returnValues.nonce,
            migrationID: event.returnValues.transactionID,
            signature: signature,
            isMigrated: false,
          },
          { upsert: true, new: true },
        );
      }
    }

    await this.blockModel.findOneAndUpdate(
      { _id: process.env.BRIDGE_ID },
      {
        ethBlock: ethNewBlock,
        bnbBlock: bnbNewBlock,
      },
    );
    }
    catch(e){
      console.log("catch deposit >>",e);
    }
  }

  @Cron('*/30 * * * * *')
  async Withdraw() {
    try{
    const blocks = await this.blockModel.findById(
      process.env.BRIDGE_Withdraw_ID,
    );
    const { events, ethNewBlock, bnbNewBlock } = await getWithdrawEvents(
      blocks,
    );

    if (events && events != undefined && events.length != 0) {
      for (const event of events) {
        await this.migrationModel.findOneAndUpdate(
          { signature: event.returnValues.sign },
          {
            isMigrated: true,
            toHash: event.transactionHash,
          },
        );
      }
    }

    await this.blockModel.findOneAndUpdate(
      { _id: process.env.BRIDGE_Withdraw_ID },
      {
        ethBlock: ethNewBlock,
        bnbBlock: bnbNewBlock,
      },
    );
    }
    catch(e){
      console.log(e);
    }
  }

  async ClaimStatus(migrationID: string) {
    const migration = await this.migrationModel.findOne({ migrationID });
    if (migration && migration.isMigrated && migration.toHash) {
      console.log('claim status');
      return {
        status: true,
        transactionHash: migration.toHash,
        amount: migration.amount,
        fromChain: migration.fromChain,
        toChain: migration.toChain,
        sender: migration.sender,
        signature: migration.signature,
      };
    } else {
      return { status: false };
    }
  }

  async DepositStatus(migrationID: string) {
    console.log('deposit status');
    const migration = await this.migrationModel.findOne({ migrationID });
    if (migration && !migration.isMigrated) {
      return {
        status: true,
        transactionHash: migration.toHash,
        amount: migration.amount,
        fromChain: migration.fromChain,
        toChain: migration.toChain,
        sender: migration.sender,
        signature: migration.signature,
        nonce: migration.nonce,
      };
    } else {
      return { status: false };
    }
  }

  async GetUnclaimed(userAddress: string) {
    const unclaimed = await this.migrationModel.findOne({
      sender: userAddress,
      isMigrated: false,
    });
    // console.log(unclaimed);
    if (unclaimed) {
      return {
        status: true,
        transactionHash: unclaimed.toHash,
        amount: unclaimed.amount,
        fromChain: unclaimed.fromChain,
        toChain: unclaimed.toChain,
        sender: unclaimed.sender,
        signature: unclaimed.signature,
        nonce: unclaimed.nonce,
        migrationID: unclaimed.migrationID,
      };
    }
  }
}
