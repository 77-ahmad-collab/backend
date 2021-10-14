const { keccak256, solidityPack } = require('ethers/lib/utils');
//const etherss = require('ethers/lib/utils');
const { ecsign } = require('ethereumjs-util');
const ethers = require('ethers');
const Web3 = require('web3');
import getKey from './getKey';

const getSignatures = async ({ sender, receiver, amount, nonce }) => {
  const key = await getKey();

  const eventSignature = keccak256(
    solidityPack(
      ['address', 'address', 'uint', 'uint'],
      [sender, receiver, Web3.utils.toWei(amount.toString(), 'gwei'), nonce],
    ),
  );

  let str = '\x19Ethereum Signed Message:\n32';

  const message = keccak256(
    solidityPack(['string', 'bytes32'], [str, eventSignature]),
  );

  // for (let i = 1; i <= 5; i++) {
  const { v, r, s } = ecsign(
    Buffer.from(message.slice(2), 'hex'),
    Buffer.from(key.slice(2), 'hex'),
  );

  // }
  const signatures =
    '0x' + r.toString('hex') + s.toString('hex') + v.toString(16);

  return signatures;
};

export default getSignatures;
