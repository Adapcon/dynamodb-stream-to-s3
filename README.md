# dynamodb-stream-to-s3

Through a lambda function, the streams of the DynamoDB tables are interpreted and replicated in S3 at the item level.
This way we implement a continuous backup and change history of each dynamodb table item (if bucket versioning is enabled).

## Getting Started

These instructions will get you a copy of the project up and running on AWS.

### Prerequisites

The configuration of the lambda function and its trigger are performed through the [serverless framework](https://serverless.com/).

Install serverless globally:
```
npm install serverless -g
```
See docs: [here](https://serverless.com/framework/docs/providers/aws/guide/installation/)

You'll also need to set up your AWS access credentials:
```
serverless config credentials --provider aws --key <access-key> --secret <secret-key>
```
See docs: [here](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

It is necessary to enable the stream of dynamodb tables that will be replicated (with a view type that contains new image).
The streams will be used in the configuration file (config.json).

### Installing

Install the dependencies:
```
npm install
```

### Setup

Creating the configuration file (config.json):
```
{
    "region": "...",
    "memorySize": 128,
    "timeout": 300,
    "streams": [
        {
            "stream": "..."
        },
        ...
    ],
    "bucket": "...",
    "tables": {
        "{table name}": {
            "key": "...",
            "sortKey": "..."
        },
        ...
    },
    "email": {
        "region": "...",
        "from": "...",
        "to": [
            "...",
            ...
        ]
    }
}
```

### Deploy

to deploy use the command below:
```
sls deploy
```
See docs: [here](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

The serverless framework will create in the IAM a role named: dynamodb-stream-to-s3-core-{your region}-lambdaRole.
You need attach the "AmazonS3FullAccess" and "AmazonDynamoDBFullAccess" policies.

Done, changes that occur in the existing tables in the configuration file will be replicated in the configured bucket.

### Integrity Check

To verify that all items in s3 are the same as the items in dynamodb, we've created the integrity check.

It identifies the differences and fixes the s3 based on dynamodb.

If your table in dynamodb already has data, you need to run the integrity check.

```
cd utils
node integrityCheckAll.js
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details