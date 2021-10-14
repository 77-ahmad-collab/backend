import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

import { chainMap } from './utils/chainMap';
import getEvents from './utils/getEvents';
import getChainMap from './utils/getChainMap';

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

    console.log('>>>', events);

    if (events && events != undefined && events.length != 0) {
      for (const event of events) {
        const amountInHex = await event.web3.eth.getTransactionReceipt(
          event.transactionHash,
        );
        const returnAmountValue = parseInt(
          amountInHex.logs[0].data.toString(),
          16,
        );
        console.log(
          Web3.utils.fromWei(returnAmountValue.toString(), 'gwei'),
          '<<<<<<<<<<<<<<<<',
        );

        await this.migrationModel.findOneAndUpdate(
          { fromHash: event.transactionHash },
          {
            amount: Web3.utils.fromWei(returnAmountValue.toString(), 'gwei'),
            // amount: 100,
            sender: event.returnValues.from,
            receiver: event.returnValues.to,
            fromChain: event.fromChain,
            toChain: event.toChain,
            fromHash: event.fromHash,
            nonce: event.returnValues.nonce,
            migrationID: event.returnValues.transactionID,
            isMigrated: false,
            isPending: false,
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
  async Migrate() {
    const migrations = await this.migrationModel.find({
      isMigrated: false,
      isPending: false,
    });
    const newChainMap = await getChainMap(chainMap);

    for (const migration of migrations) {
      if (newChainMap[migration.toChain].skip) {
        continue;
      }

      let count = await newChainMap[
        migration.toChain
      ].web3.eth.getTransactionCount(
        newChainMap[migration.toChain].admin,
        'pending',
      );

      let signatures = await getSignatures(migration);

      console.log(
        'params ==>>>',
        migration.sender,
        migration.receiver,
        newChainMap[migration.toChain].web3.utils.toWei(
          migration.amount.toString(),
          'gwei',
        ),
        migration.nonce,
        signatures,
      );

      let transaction = await newChainMap[
        migration.toChain
      ].web3.eth.accounts.signTransaction(
        {
          from: newChainMap[migration.toChain].admin,
          to: newChainMap[migration.toChain].bridge,
          data: newChainMap[migration.toChain].contract.methods
            .withdrawTokens(
              migration.sender,
              migration.receiver,
              newChainMap[migration.toChain].web3.utils.toWei(
                migration.amount.toString(),
                'gwei',
              ),
              migration.nonce,
              signatures,
            )
            .encodeABI(),
          gasPrice: await newChainMap[migration.toChain].web3.utils.toHex(
            10 * 1000000000,
          ),
          nonce: count,
          gasLimit: newChainMap[migration.toChain].web3.utils.toHex(8000000),
          chainId: migration.toChain,
        },
        newChainMap[migration.toChain].privatekey,
      );

      newChainMap[migration.toChain].web3.eth
        .sendSignedTransaction(transaction.rawTransaction)
        .on('transactionHash', async (hash) => {
          console.log('hash', hash);
          await this.migrationModel.findOneAndUpdate(
            { fromHash: migration.fromHash },
            { isPending: true },
          );
        })
        .on('confirmation', async (confirmationNumber, receipt) => {
          if (confirmationNumber == 2) {
            await this.migrationModel.findOneAndUpdate(
              { fromHash: migration.fromHash },
              { isMigrated: true, toHash: receipt.transactionHash },
            );
          }
        })
        .on('error', async (error) => {
          console.log('claim transaction error==>>', error);
          await this.migrationModel.findOneAndUpdate(
            { fromHash: migration.fromHash },
            { isPending: false },
          );
        });
    }
  }

  async ClaimStatus(migrationID: string) {
    const migration = await this.migrationModel.findOne({ migrationID });
    if (migration && migration.isMigrated) {
      return {
        status: true,
        transactionHash: migration.toHash,
        amount: migration.amount,
        fromChain: migration.fromChain,
        toChain: migration.toChain,
        sender: migration.sender,
      };
    } else {
      return { status: false };
    }
  }
}
