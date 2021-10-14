import getKey from './getKey';

const {
  defaultAbiCoder,
  keccak256,
  solidityPack,
} = require('ethers/lib/utils');

const { ecsign } = require('ethereumjs-util');

const Web3 = require('web3');

export default async ({
  blockNumber,
  transactionIndex,
  bridgeAddress,
  tokenAddress,
  returnValues,
}) => {
  const key = await getKey();
  const { amount, from } = returnValues;

  let Id = keccak256(
    defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [blockNumber, transactionIndex],
    ),
  );

  const DomainSeparator = keccak256(
    defaultAbiCoder.encode(['string', 'address'], ['0x01', bridgeAddress]),
  );
  var message = keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'address'],
      [Id, from, Web3.utils.toWei(amount.toString()), tokenAddress],
    ),
  );
  var finalHash = keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', DomainSeparator, message],
    ),
  );
  const { v, r, s } = ecsign(
    Buffer.from(finalHash.slice(2), 'hex'),
    Buffer.from(key.slice(2), 'hex'),
  );
  return { v: v, r: '0x' + r.toString('hex'), s: '0x' + s.toString('hex') };
};
