const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

// Configure the AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.SQS_QUEUE_URL;

// Create SQS client
const sqsClient = new SQSClient({ region });

/**
 * Process a single message from SQS
 * @param {Object} message - The SQS message object
 */
async function processMessage(message) {
  try {
    // Parse the message body
    const report = PetClinicReport.from(message.body);
    const messageBody = JSON.parse(message.Body);
    console.log('Received message:', messageBody);
    
    // Process the message according to your application needs
    // ...

    // Delete the message from the queue after successful processing
    await deleteMessage(message.ReceiptHandle);
    console.log('Message processed and deleted from queue');
  } catch (error) {
    console.error('Error processing message:', error);
    // Handle error - you might want to move the message to a DLQ or retry
  }
}

/**
 * Delete a message from the SQS queue
 * @param {string} receiptHandle - The receipt handle of the message
 */
async function deleteMessage(receiptHandle) {
  const deleteParams = {
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  };
  
  try {
    await sqsClient.send(new DeleteMessageCommand(deleteParams));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * Poll SQS queue for messages
 */
async function pollQueue() {
  if (!queueUrl) {
    console.error('SQS_QUEUE_URL environment variable is not set');
    process.exit(1);
  }

  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10, // Receive up to 10 messages at once
    WaitTimeSeconds: 20,     // Long polling - wait up to 20 seconds for messages
    VisibilityTimeout: 30    // Hide message from other consumers for 30 seconds
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    
    if (data.Messages && data.Messages.length > 0) {
      console.log(`Received ${data.Messages.length} messages`);
      
      // Process each message
      const processPromises = data.Messages.map(message => processMessage(message));
      await Promise.all(processPromises);
    } else {
      console.log('No messages received');
    }
  } catch (error) {
    console.error('Error receiving messages:', error);
  }
  
  // Continue polling
  setTimeout(pollQueue, 100);
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting SQS consumer for queue: ${queueUrl}`);
  
  // Start polling for messages
  await pollQueue();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down SQS consumer');
  process.exit(0);
});

// Start the consumer
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
