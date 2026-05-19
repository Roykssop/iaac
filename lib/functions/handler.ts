import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda'
import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';


const newOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = uuidv4();
  let orderPayload;
  try {
    orderPayload = JSON.parse(event.body || '{}');
    await sendMessageToSqs({ id, ...orderPayload }, process.env.PENDING_ORDERS_QUEUE_URL as string);
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
  const orderIds = new Set(['1', '2', '3']);
  const id = event.pathParameters?.id;


  if (!id || !orderIds.has(id)) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Order Not found'
      })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      id,
      tipo: 'Margarita',
      precio: 15
    })
  }
}

const prepOrder = async (event: SQSEvent) => {
  console.log('Queue test message', event);

  return;
}

const sendOrder = async (event) => {

  const order = {
    orderId: event.orderId,
    tipo: event.tipo,
    precio: event.precio
  }
  console.log(order);
  await sendMessageToSqs(event, process.env.ORDERS_TO_SEND_QUEUE_URL)
}

const sendMessageToSqs = async (message: string, queueUrl: string) => {

  if (!queueUrl) {
    console.error('QUEUE_URL is not defined');
    throw new Error('QUEUE_URL is not defined');
  }

  const client = new SQSClient({});
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
  });

  try {
    const data = await client.send(command);
    console.log('Message sent to SQS:', data.MessageId);
    return data;
  } catch (error) {
    console.error('Error sending message to SQS:', error);
    throw error;
  }
}


export { getOrder, newOrder, prepOrder, sendOrder };