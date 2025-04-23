import { exec } from "node:child_process";

interface ToolContext {
  readonly fs: typeof import("node:fs");
  readonly path: typeof import("node:path");
  readonly os: typeof import("node:os");
  readonly process: typeof import("node:process");
  readonly rootDir: string;
  readonly validFileGlobs: string[];
  readonly excludedFileGlobs: string[];
}

interface SQSLocalToolParams {
  action: "start" | "stop" | "status" | "list" | "purge";
  queueName?: string;
  port?: number;
}

/**
 * Tool for managing a local SQS instance for development and testing
 */
class SQSLocalTool {
  constructor(private readonly context: ToolContext) {}

  public readonly name = "SQSLocalTool";

  public readonly description =
    "Manages a local SQS instance using ElasticMQ for development and testing. Supports starting, stopping, and managing queues.";

  public readonly inputSchema = {
    json: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["start", "stop", "status", "list", "purge"],
          description: "Action to perform on the local SQS instance"
        },
        queueName: {
          type: "string",
          description: "Name of the queue to operate on (required for purge action)"
        },
        port: {
          type: "number",
          description: "Port to run ElasticMQ on (default: 9324)"
        }
      },
      required: ["action"],
      additionalProperties: false
    }
  } as const;

  public async execute(params: SQSLocalToolParams) {
    const { action, queueName, port = 9324 } = params;

    // Validate Docker is installed
    try {
      await this.execCommand("docker --version");
    } catch (error) {
      return {
        status: "error",
        message: "Docker is not installed or not running. Please install Docker to use this tool."
      };
    }

    switch (action) {
      case "start":
        return this.startLocalSQS(port);
      case "stop":
        return this.stopLocalSQS();
      case "status":
        return this.getSQSStatus();
      case "list":
        return this.listQueues();
      case "purge":
        if (!queueName) {
          return {
            status: "error",
            message: "queueName is required for purge action"
          };
        }
        return this.purgeQueue(queueName);
      default:
        return {
          status: "error",
          message: `Invalid action: ${action}`
        };
    }
  }

  private async startLocalSQS(port: number) {
    const containerName = "pet-clinic-sqs-local";
    const dockerCommand =
      `docker run -d --name ${containerName} -p ${port}:9324 -p 9325:9325 softwaremill/elasticmq`;

    try {
      // Check if container already exists
      const { stdout } = await this.execCommand(
        `docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`
      );

      if (stdout.trim()) {
        if (stdout.startsWith("Up")) {
          return {
            status: "success",
            message: "Local SQS is already running",
            port,
            endpoint: `http://localhost:${port}`
          };
        }
        // Container exists but is not running, remove it
        await this.execCommand(`docker rm ${containerName}`);
      }

      // Start new container
      await this.execCommand(dockerCommand);

      return {
        status: "success",
        message: "Local SQS started successfully",
        port,
        endpoint: `http://localhost:${port}`
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to start local SQS",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async stopLocalSQS() {
    const containerName = "pet-clinic-sqs-local";

    try {
      await this.execCommand(`docker stop ${containerName}`);
      await this.execCommand(`docker rm ${containerName}`);

      return {
        status: "success",
        message: "Local SQS stopped and removed successfully"
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to stop local SQS",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async getSQSStatus() {
    const containerName = "pet-clinic-sqs-local";

    try {
      const { stdout } = await this.execCommand(
        `docker ps --filter "name=${containerName}" --format "{{.Status}}"`
      );

      return {
        status: "success",
        message: stdout.trim()
          ? "Local SQS is running"
          : "Local SQS is not running",
        running: Boolean(stdout.trim()),
        containerStatus: stdout.trim() || "Not running"
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to get SQS status",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async listQueues() {
    const containerName = "pet-clinic-sqs-local";

    try {
      const { stdout: containerStatus } = await this.execCommand(
        `docker ps --filter "name=${containerName}" --format "{{.Status}}"`
      );

      if (!containerStatus.trim()) {
        return {
          status: "error",
          message: "Local SQS is not running"
        };
      }

      // Use AWS CLI with local endpoint to list queues
      const { stdout } = await this.execCommand(
        "aws sqs list-queues --endpoint-url http://localhost:9324"
      );

      const queues = JSON.parse(stdout).QueueUrls || [];

      return {
        status: "success",
        message: "Retrieved queue list successfully",
        queues
      };
    } catch (error) {
      return {
        status: "error",
        message: "Failed to list queues",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async purgeQueue(queueName: string) {
    try {
      const { stdout: containerStatus } = await this.execCommand(
        'docker ps --filter "name=pet-clinic-sqs-local" --format "{{.Status}}"'
      );

      if (!containerStatus.trim()) {
        return {
          status: "error",
          message: "Local SQS is not running"
        };
      }

      // Purge the queue using AWS CLI with local endpoint
      await this.execCommand(
        `aws sqs purge-queue --queue-url http://localhost:9324/queue/${queueName} --endpoint-url http://localhost:9324`
      );

      return {
        status: "success",
        message: `Queue ${queueName} purged successfully`
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to purge queue ${queueName}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private execCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

export default SQSLocalTool;
