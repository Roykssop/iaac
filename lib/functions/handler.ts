import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

type Order = {
  id: string;
  tipo: string;
  precio: number;
  status: string;
  clienteId: string;
}

const sqsClient = new SQSClient({});
const dynamoDBClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

const newOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = uuidv4();
  let orderPayload;
  try {
    orderPayload = JSON.parse(event.body || '{}');
    const order: Order = { id, status: 'PENDIENTE', ...orderPayload };
    await saveOrderItem(order);
    await sendMessageToSqs(order, process.env.PENDING_ORDERS_QUEUE_URL as string);
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Payload given is invalid" })
    }
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: { id, ...orderPayload }
    })
  }
}

const getOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing order id' })
    }
  }

  try {
    const command = new GetCommand({
      TableName: process.env.ORDERS_TABLE_NAME,
      Key: { id }
    });
    const response = await dynamoDocClient.send(command);

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Order Not found' })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.Item)
    }
  } catch (error) {
    console.error('Error getting order', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving order' })
    }
  }
}

const prepOrder = async (event: SQSEvent) => {
  console.log('Processing preparation event', event);

  for (const record of event.Records) {
    try {
      const order = JSON.parse(record.body);
      await updateOrderStatus(order.id, 'PREPARADO');
      console.log(`Order ${order.id} updated to PREPARADO`);
    } catch (error) {
      console.error('Error processing SQS record', error);
    }
  }
}

const sendOrder = async (event) => {
  console.log(event);

  if (event.Records[0].eventName === 'MODIFY') {
    const eventBody = event.Records[0].dynamodb;
    console.log(eventBody)

    const orderDetails = eventBody.NewImage;
    try {
      const order: Order = {
        id: orderDetails.id.S,
        tipo: orderDetails.tipo.S,
        precio: Number(orderDetails.precio.N),
        clienteId: orderDetails.clienteId.S,
        status: orderDetails.status.S
      }
      console.log(order)

      await sendMessageToSqs(event, process.env.ORDERS_TO_SEND_QUEUE_URL as string)
    } catch (error) {
      console.log("Error processing order:", error);
      return;
    }
  }
  return;
}

const sendMessageToSqs = async (message: any, queueUrl: string) => {

  if (!queueUrl) {
    console.error('QUEUE_URL is not defined');
    throw new Error('QUEUE_URL is not defined');
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  });

  try {
    const data = await sqsClient.send(command);
    console.log('Message sent to SQS:', data.MessageId);
    return data;
  } catch (error) {
    console.error('Error sending message to SQS:', error);
    throw error;
  }
}

const saveOrderItem = async (order: Order) => {
  const params = {
    TableName: process.env.ORDERS_TABLE_NAME,
    Item: order
  }

  console.log(params);

  try {
    const command = new PutCommand(params);
    const response = await dynamoDocClient.send(command);
    console.log(`Item ${order.id} saved`);
    console.log('RESPONSE SAVE DYNAMO', response);
    return response;
  } catch (error) {
    console.log('Error saving order', error);
    throw new Error('Error saving order');
  }
}

const updateOrderStatus = async (id: string, status: string) => {
  const params = {
    TableName: process.env.ORDERS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set #s = :status',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':status': status }
  };

  try {
    const command = new UpdateCommand(params);
    await dynamoDocClient.send(command);
  } catch (error) {
    console.error('Error updating order status', error);
    throw new Error('Error updating order status');
  }
}


export { getOrder, newOrder, prepOrder, sendOrder };