const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Configure the AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.SQS_QUEUE_URL;
const dlqUrl = process.env.SQS_DLQ_URL || process.env.SQS_QUEUE_URL + '-dlq';

// Create SQS client
const sqsClient = new SQSClient({ region });

/**
 * Process messages from dead letter queue for retry
 */
async function processDeadLetterQueue() {
  const params = {
    QueueUrl: dlqUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 5,
    VisibilityTimeout: 30
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    
    if (data.Messages && data.Messages.length > 0) {
      console.log(`Processing ${data.Messages.length} messages from DLQ`);
      
      for (const message of data.Messages) {
        try {
          // Attempt to reprocess the message
          await processMessage(message, true);
          
          // If successful, delete from DLQ
          await deleteMessage(message.ReceiptHandle, dlqUrl);
          console.log('Successfully reprocessed message from DLQ');
        } catch (error) {
          console.error('Failed to reprocess DLQ message:', error);
          // Leave message in DLQ for manual investigation
        }
      }
    }
  } catch (error) {
    console.error('Error processing DLQ:', error);
  }
}

/**
 * Process a single message from SQS
 * @param {Object} message - The SQS message object
 * @param {boolean} isRetry - Whether this is a retry from DLQ
 */
async function processMessage(message, isRetry = false) {
  try {
    // Parse the message body
    const messageBody = JSON.parse(message.Body);
    console.log('Received message:', messageBody);
    
    // Process the message according to your application needs
    // add null checks for all the properties
    if (messageBody && messageBody.petId && messageBody.petName
        && messageBody.petType && messageBody.ownerId && messageBody.ownerName
        && messageBody.ownerSurname && messageBody.vetId && messageBody.vetName
        && messageBody.vetSurname && messageBody.appointmentDate && messageBody.appointmentTime
        && messageBody.appointmentType && messageBody.appointmentDescription) {
      const report = PetClinicReport.from(message.body);

      console.log('Processed report:', report);
    } else {
      console.log('Invalid message format. Skipping processing.');
      // throw exception
      throw new Error('Invalid message format. Skipping processing.');
    }

    // Delete the message from the queue after successful processing
    const targetQueue = isRetry ? dlqUrl : queueUrl;
    await deleteMessage(message.ReceiptHandle, targetQueue);
    console.log('Message processed and deleted from queue');
  } catch (error) {
    console.error('Error processing message:', error);
    throw new Error('Error processing message:' + error);
  }
}

/**
 * Delete a message from the SQS queue
 * @param {string} receiptHandle - The receipt handle of the message
 * @param {string} targetQueue - The queue URL to delete from
 */
async function deleteMessage(receiptHandle, targetQueue = queueUrl) {
  const deleteParams = {
    QueueUrl: targetQueue,
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
    return;
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
  
  // Process DLQ messages periodically
  if (Math.random() < 0.1) { // 10% chance to check DLQ
    await processDeadLetterQueue();
  }
  
  // Continue polling
  setTimeout(pollQueue, 100);
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting SQS consumer for queue: ${queueUrl}`);
  console.log(`DLQ configured at: ${dlqUrl}`);
  
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
