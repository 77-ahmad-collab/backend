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

  @Cron('*/15 * * * * *')
  async Receive() {
    const blocks = await this.blockModel.findById(process.env.BRIDGE_ID);
    const { events, ethNewBlock, bnbNewBlock } = await getEvents(blocks);

    if (events && events != undefined && events.length != 0) {
      for (const event of events) {
        const amountInHex = await event.web3.eth.getTransactionReceipt(
          event.transactionHash,
        );
        const returnAmountValue = parseInt(
          amountInHex.logs[0].data.toString(),
          16,
        );

        let signature = await getSignatures({
          sender: event.returnValues.from,
          receiver: event.returnValues.to,
          nonce: event.returnValues.nonce,
          amount: Web3.utils.fromWei(returnAmountValue.toString(), 'gwei'),
        });

        let calculateAmount = 0;
        if (event.fromChain === 4) {
          calculateAmount = await calculateTransferFee(
            Web3.utils.fromWei(returnAmountValue.toString(), 'gwei'),
          );
        } else {
          calculateAmount = Web3.utils.fromWei(
            returnAmountValue.toString(),
            'gwei',
          );
        }

        console.log('>>>>>>>>>>', calculateAmount);

        await this.migrationModel.findOneAndUpdate(
          { fromHash: event.transactionHash },
          {
            amount: calculateAmount,
            // amount: 100,
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

  @Cron('*/15 * * * * *')
  async Withdraw() {
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
      };
    }
  }

  async UpdateToHash(signature: string, transactionHash: string) {
    console.log('uodate>>');
    await this.migrationModel.findOneAndUpdate(
      { signature: signature },
      { toHash: transactionHash },
    );
  }
}
