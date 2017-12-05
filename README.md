# dynamodb-stream-to-s3
Through a lambda function, the streams of the DynamoDB tables are interpreted and replicated in S3 at the item level.



# Integrity Check

Request a POST to https://{your-url-from-sls-deploy}.amazonaws.com/core/integrityCheck

Body:

{
	"table": "Log",
	"execute": true
}

