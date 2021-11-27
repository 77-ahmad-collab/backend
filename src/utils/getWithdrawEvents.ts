require('dotenv').config();
import { BRIDGE_ABI } from '../constants/ABI';
const Web3 = require('web3');

export default async (bridge) => {
  let allEvents = [];
  let ethNewBlock: number;
  let bnbNewBlock: number;

  const randomNumber = Math.floor(Math.random() * 5) + 1;

  if (bridge) {
    try {
      if (process.env.BRIDGE_ERC20) {
        let web3 = new Web3(process.env[`PROVIDER_ERC20${randomNumber}`]);

        if (bridge.ethBlock) {
          let contract = new web3.eth.Contract(
            BRIDGE_ABI,
            process.env.BRIDGE_ERC20,
          );

          const currentBlock = await web3.eth.getBlockNumber();
          let toBlock = currentBlock;
          if (currentBlock - bridge.ethBlock > 99) {
            toBlock = bridge.ethBlock + 99;
          }

          let events = await contract.getPastEvents('TokenWithdraw', {
            fromBlock: bridge.ethBlock,
            toBlock,
          });

          if (events && events.length != 0) {
            events.forEach((event) => {
              event.fromChain = process.env.NETWORK_ERC20;
              event.toChain = process.env.NETWORK_BEP20;
              event.tokenAddress = process.env.TOKEN_ERC20;
              event.bridgeAddress = process.env.BRIDGE_ERC20;
              event.web3 = web3;
            });
            allEvents = allEvents.concat(events);
          }
          ethNewBlock = toBlock + 1;
        } else {
          ethNewBlock = await web3.eth.getBlockNumber();
        }
      }
    } catch (error) {
      console.log('withdraw eth block error');
      ethNewBlock = bridge.ethBlock;
    }

    try {
      if (process.env.BRIDGE_BEP20) {
        let web3 = new Web3(process.env[`PROVIDER_BEP20${randomNumber}`]);

        if (bridge.bnbBlock) {
          let contract = new web3.eth.Contract(
            BRIDGE_ABI,
            process.env.BRIDGE_BEP20,
          );
          const currentBlock = await web3.eth.getBlockNumber();

          let toBlock = currentBlock <  bridge.bnbBlock ? bridge.bnbBlock : currentBlock;
          if (currentBlock - bridge.bnbBlock > 99) {
            toBlock = bridge.bnbBlock + 99;
          }

          let events = await contract.getPastEvents('TokenWithdraw', {
            fromBlock: bridge.bnbBlock,
            toBlock,
          });

          if (events && events.length != 0) {
            events.forEach((event) => {
              event.fromChain = process.env.NETWORK_BEP20;
              event.toChain = process.env.NETWORK_ERC20;
              event.tokenAddress = process.env.TOKEN_BEP20;
              event.bridgeAddress = process.env.BRIDGE_BEP20;
              event.web3 = web3;
            });
            allEvents = allEvents.concat(events);
          }
          bnbNewBlock = toBlock + 1;
        } else {
          bnbNewBlock = await web3.eth.getBlockNumber();
        }
      }
    } catch (error) {
      console.log('withdraw eth block error');
      bnbNewBlock = bridge.bnbBlock;
    }
  }

  return {
    events: allEvents,
    ethNewBlock: ethNewBlock,
    bnbNewBlock: bnbNewBlock,
  };
};
