import { BRIDGE_ABI } from '../constants/ABI';
import getKey from './getKey';
const Web3 = require('web3');

export default async (chainMap) => {
  const key = await getKey();

  const randomNumber = Math.floor(Math.random() * 5) + 1;

  for (const chainId of Object.keys(chainMap)) {
    const web3 = new Web3(
      process.env[chainMap[chainId].rpcName + randomNumber],
    );

    let AdminFunds = Number(
      await web3.eth.getBalance(process.env.ADMIN_ADDRESS),
    );

    AdminFunds = Number(web3.utils.fromWei(AdminFunds.toString()));

    chainMap[chainId]['skip'] = AdminFunds < 0.05 ? true : false;
    chainMap[chainId]['admin'] = process.env.ADMIN_ADDRESS;
    chainMap[chainId]['privatekey'] = key;
    chainMap[chainId]['web3'] = web3;
    chainMap[chainId]['contract'] = await new web3.eth.Contract(
      BRIDGE_ABI,
      chainMap[chainId].bridge,
    );
  }

  return chainMap;
};
