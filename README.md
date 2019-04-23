# 🦉 eth-owl
Watch any Ethereum address with 🦉 `eth-owl` to receive real-time callbaks to your webhook(s) for each incoming/outgoing transaction. A permissionless, pseudo-anonymous Ethereum SaaS utility for developers

## Quickstart
- setup your REST API endpoint that will receive `POST` requests from 🦉 `eth-owl`
- `purchase` your webhook via the `ethOwl` smart contract https://etherscan.io/address/0x70C92A8A51191378a6ec8ce0493aa7a3f469425C#writeContract

![ScreenShot](./purchase.png)

```javascript
{
  purchase: 0.1, // 🦉 `eth-owl` costs 0.1 ETH per webhook, per year
  _addr: '0x70C92A8A51191378a6ec8ce0493aa7a3f469425C', // address to watch
  _endpoint: 'https://yhk4twhgq8.execute-api.us-east-1.amazonaws.com/prod/swoops' // your REST API endpoint that will be pinged (a POST request) for each incoming/outgoing transaction to `_addr`
}
```

#### Docs for your REST API POST endpoint

- PATH
  - `/{your_endpoint_name}`

- Method:
  - POST

- Data params:
  - Required:
    - address=[string] The Ethereum address with an incoming/outgoing transaction that triggered this POST request
    - hash=[string] The transaction hash that triggered this POST request

- Success response:
  - statusCode: `{status_code}`

- Error response:
  - statusCode: `{error_code}` 🦉 `eth-owl` will retry the `POST` request 60 seconds later upon an error

- Sample Call:
  `curl -d '{"address":"0x70C92A8A51191378a6ec8ce0493aa7a3f469425C", "hash":"0xf6d591442a2ae297c383fe74d9e28233844da780f39d93037540232ea75ce6fa"}' -H "Content-Type: application/json" -X POST https://yhk4twhgq8.execute-api.us-east-1.amazonaws.com/prod/swoops`
  
#### 🐶 Dog friendly

In our example [swoops](swoops/), we use the [Serverless Framework](https://serverless.com/) to have a [Lambda](https://aws.amazon.com/lambda/) function that runs anytime our `endpoint` is pinged by `eth-owl`.

Note: `eth-owl` watches the `EthOwl` smart contract where webhooks are `purchase`d by our users. The `swoops` endpoint watches this smart contract `0x70C92A8A51191378a6ec8ce0493aa7a3f469425C`, and is pinged by `eth-owl` for each incoming/outgoing transaction. The code it runs adds the `_addr` and `_endpoint` to our database, and `eth-owl` now watches all incoming/outgoing transactions for `_addr` and hoots to `endpoint`!
