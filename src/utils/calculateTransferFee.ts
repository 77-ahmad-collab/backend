import Web3 from 'web3';
import { ETH_TOKEN_ABI } from 'src/constants/ABI';

export async function calculateTransferFee(amount) {
  const randomNumber = Math.floor(Math.random() * 5) + 1;

  // @ts-ignore
  const web3 = new Web3(process.env[`PROVIDER_ERC20${randomNumber}`]);
  // @ts-ignore
  const contractInstance = new web3.eth.Contract(ETH_TOKEN_ABI, process.env.TOKEN_ERC20);
  const { dev, liquidity, research, rfi } = await contractInstance.methods
    .feeRates()
    .call();

  const trfi = amount * (rfi / 100);
  const tLiquidity = amount * (liquidity / 100);
  const tResearch = amount * (research / 100);
  const tDev = amount * (dev / 100);

  const finalAmount = amount - (trfi + tLiquidity + tResearch + tDev);

  return finalAmount;
}
