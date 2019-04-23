const AWS = require('aws-sdk');

const ApolloBoost = require('apollo-boost');
const assert = require('assert');
const gql = require('graphql-tag');
const util = require('ethereumjs-util');
const { hexToUtf8 } = require('web3-utils');

const ddb = new AWS.DynamoDB.DocumentClient();

require('es6-promise').polyfill();
require('isomorphic-fetch');

const client = new ApolloBoost.default({ uri: 'https://ethql-alpha.infura.io/graphql' });
const contract = '0x70C92A8A51191378a6ec8ce0493aa7a3f469425C';

module.exports.swoops = async (event, context, callback) => {
  const { address, hash } = JSON.parse(decodeURI(event.body));
  console.log(address, hash);
  if (address !== contract) assert(false);

  const query = gql(`query {
    transaction(hash: "${hash}") {
      hash
      logs {
        data
        topics
      }
      to {
        address
      }
    }
  }`);

  const { data } = await client.query({ query, fetchPolicy: 'no-cache' });
  if (!data.transaction || data.transaction.hash !== hash || data.transaction.to.address !== contract) assert(false);

  const [log] = data.transaction.logs;
  console.log(log);

  const addressBytes = log.data.slice(0, 2 + 64);
  const endpointBytes = `0x${log.data.slice(2 + 64 * 3)}`;
  console.log(addressBytes, endpointBytes);

  assert(util.isValidAddress(`0x${util.unpad(addressBytes)}`));
  const endpoint = hexToUtf8(endpointBytes);
  console.log(endpoint);

  await ddb
    .update({
      ConditionExpression: 'not contains (#endpoints, :endpoint)',
      ExpressionAttributeNames: { '#endpoints': 'endpoints', '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':endpoint': endpoint,
        ':endpoint_list': [endpoint],
        ':ttl': 1000 * 3600 * 24 * 7 * 52,
      },
      Key: { address: util.toChecksumAddress(`0x${util.unpad(addressBytes)}`) },
      TableName: process.env.addresses_table_arn.split('/').pop(),
      UpdateExpression: 'set #endpoints = list_append(if_not_exists(#endpoints, :empty_list), :endpoint_list), #ttl = :ttl',
    })
    .promise();

  callback(null, { statusCode: 200, body: 'success' });
};
