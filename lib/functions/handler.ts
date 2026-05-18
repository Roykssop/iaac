import { v4 as uuidv4 } from 'uuid';

export const newOrder = async (event) => {
  const id = uuidv4();
  let orderPayload;
  try {
    orderPayload = JSON.parse(event.body);
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Payload given is invalid" })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: { id, ...orderPayload }
    })
  }
}