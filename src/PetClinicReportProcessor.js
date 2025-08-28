const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

// Configure the AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
const queueUrl = process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/pet-clinic-reports';

// Create SQS client with optimized configuration
const sqsClient = new SQSClient({ 
  region,
  maxAttempts: 3,
  requestTimeout: 30000
});

/**
 * Process a single message from SQS with enhanced error handling
 * @param {Object} message - The SQS message object
 */
async function processMessage(message) {
  try {
    // Parse the message body
    const messageBody = JSON.parse(message.Body);
    console.log('Processing report message:', messageBody);
    
    // Enhanced validation with better memory efficiency
    const requiredFields = ['petId', 'petName', 'petType', 'ownerId', 'ownerName', 
                           'ownerSurname', 'vetId', 'vetName', 'vetSurname', 
                           'appointmentDate', 'appointmentTime', 'appointmentType', 'appointmentDescription'];
    
    const isValid = requiredFields.every(field => messageBody && messageBody[field]);
    
    if (isValid) {
      const report = {
        id: messageBody.petId,
        petInfo: {
          name: messageBody.petName,
          type: messageBody.petType
        },
        ownerInfo: {
          id: messageBody.ownerId,
          name: `${messageBody.ownerName} ${messageBody.ownerSurname}`
        },
        vetInfo: {
          id: messageBody.vetId,
          name: `${messageBody.vetName} ${messageBody.vetSurname}`
        },
        appointment: {
          date: messageBody.appointmentDate,
          time: messageBody.appointmentTime,
          type: messageBody.appointmentType,
          description: messageBody.appointmentDescription
        },
        processedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      };

      console.log('Successfully processed report:', report.id);
      
      // Simulate report processing with memory-optimized operations
      await processReportData(report);
    } else {
      console.error('Invalid message format - missing required fields');
      throw new Error('Invalid message format - missing required fields');
    }

    // Delete the message from the queue after successful processing
    await deleteMessage(message.ReceiptHandle);
    console.log('Message processed and removed from queue');
  } catch (error) {
    console.error('Error processing message:', error.message);
    throw new Error(`Message processing failed: ${error.message}`);
  }
}

/**
 * Process report data with memory optimization
 * @param {Object} report - The processed report object
 */
async function processReportData(report) {
  // Simulate processing with better memory management
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Report ${report.id} processed in ${report.environment} environment`);
      resolve();
    }, 100);
  });
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
 * Poll SQS queue for messages with updated configuration
 */
async function pollQueue() {
  if (!queueUrl) {
    console.error('SQS_QUEUE_URL environment variable is not set');
    return;
  }

  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 300    // Updated to match queue configuration
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    
    if (data.Messages && data.Messages.length > 0) {
      console.log(`Received ${data.Messages.length} messages from pet-clinic-reports queue`);
      
      // Process messages with better memory management
      for (const message of data.Messages) {
        try {
          await processMessage(message);
        } catch (error) {
          console.error(`Failed to process message: ${error.message}`);
        }
      }
    } else {
      console.log('No messages available in queue');
    }
  } catch (error) {
    console.error('Error receiving messages from queue:', error);
  }
  
  // Continue polling with optimized interval
  setTimeout(pollQueue, 1000);
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting enhanced SQS consumer for queue: ${queueUrl}`);
  console.log(`Running in ${process.env.NODE_ENV || 'production'} environment`);
  
  // Start polling for messages
  await pollQueue();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Gracefully shutting down SQS consumer');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the consumer
main().catch(error => {
  console.error('Fatal error in event processor:', error);
  process.exit(1);
});
