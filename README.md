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
serverless config credentials --provider aws --key AKIAIOSFODNN7EXAMPLE --secret wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
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
    }
}
```

### Deploy

to deploy use the command below:
```
sls deploy
```
See docs: [here](https://serverless.com/framework/docs/providers/aws/guide/deploying/)

The serverless framework will create in the IAM a role named: adapcon-dynamodb-stream-to-s3-core-{your region}-lambdaRole.
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
 
The MIT License (MIT)

Copyright (c) 2015 Chris Kibble

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.