import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const newOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = uuidv4();
  let orderPayload;
  try {
    orderPayload = JSON.parse(event.body || '{}');
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


export { getOrder, newOrder };