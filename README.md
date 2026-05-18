# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Aws CLI
* `aws sqs list-queues`   List all queues
* `aws sqs get-queue-url --queue-name {queue-name}`   get queue url by name
* `aws sqs send-message --queue-url {queue-url} --message-body {message-string} --region {resource-aws-region}`  send message to queue



