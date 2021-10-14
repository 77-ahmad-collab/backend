require('dotenv').config();

import * as AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

export default async () => {
  // var kms = new AWS.KMS();
  // let kmsParams = {
  //   Plaintext:
  //     '0x5da45c9023c9c54495fbd29df3af6ca2a6427e28ae74d5379e055fcd1d957512', // The encrypted data (ciphertext).
  //   KeyId: '78c01a62-3b95-4ed4-a666-da1c215076c5', // A key identifier for the KMS key to use to decrypt the data.
  // };
  // const { CiphertextBlob } = await kms.encrypt(kmsParams).promise();
  // let encryptedData = CiphertextBlob.toString('base64');
  // console.log(encryptedData);
  // var s3 = new AWS.S3();
  // var s3Params = {
  //   Body: encryptedData,
  //   Bucket: 'private-keys-sonar',
  //   Key: 'signature-generator',
  // };
  // const s3Object = await s3.putObject(s3Params).promise();

  // const s3 = new AWS.S3();
  // const s3Params = {
  //   Bucket: 'private-keys-sonar',
  //   Key: 'signature-generator',
  // };
  // const encryptedData: any = await s3.getObject(s3Params).promise();

  // console.log(encryptedData);

  const kms = new AWS.KMS();
  let kmsParams = {
    CiphertextBlob: Buffer.from(process.env.KMS, 'base64'),
  };
  const { Plaintext } = await kms.decrypt(kmsParams).promise();
  let decryptedData = Plaintext.toString();
  return decryptedData;
};
