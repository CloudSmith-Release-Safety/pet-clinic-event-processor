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

interface TestRunnerToolParams {
  testPattern?: string;
  coverage?: boolean;
  watch?: boolean;
}

/**
 * Tool for running Jest tests in the Pet Clinic project
 */
class TestRunnerTool {
  constructor(private readonly context: ToolContext) {}

  public readonly name = "TestRunnerTool";

  public readonly description =
    "Runs Jest tests for the Pet Clinic project. Can run specific test patterns and generate coverage reports.";

  public readonly inputSchema = {
    json: {
      type: "object",
      properties: {
        testPattern: {
          type: "string",
          description: "Optional pattern to filter which tests to run (e.g., 'PetClinicReport' or '*.test.js')"
        },
        coverage: {
          type: "boolean",
          description: "Whether to generate a coverage report (default: false)"
        }
      },
      additionalProperties: false
    }
  } as const;

  public async execute(params: TestRunnerToolParams) {
    const { testPattern = "", coverage = false } = params;

    // Validate package.json exists and has jest configuration
    const packageJsonPath = this.context.path.join(this.context.rootDir, "package.json");
    if (!this.context.fs.existsSync(packageJsonPath)) {
      return {
        status: "error",
        message: "No package.json found. Please ensure the project is properly set up with Jest."
      };
    }

    // Build the Jest command
    let jestCommand = "npx jest";

    if (testPattern) {
      // Escape special characters in the test pattern
      const escapedPattern = testPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      jestCommand += ` --testPathPattern="${escapedPattern}"`;
    }

    if (coverage) {
      jestCommand += " --coverage";
    }

    return new Promise<Record<string, any>>((resolve) => {
      exec(jestCommand, { cwd: this.context.rootDir }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            status: "error",
            message: "Error running tests:",
            error: error.message,
            stdout,
            stderr
          });
        } else {
          resolve({
            status: "success",
            message: "Tests completed successfully:",
            output: stdout,
            coverage: coverage ? this.parseCoverageReport() : undefined
          });
        }
      });
    });
  }

  private parseCoverageReport(): Record<string, any> | undefined {
    const coverageDir = this.context.path.join(this.context.rootDir, "coverage");
    const coverageSummaryPath = this.context.path.join(coverageDir, "coverage-summary.json");

    if (!this.context.fs.existsSync(coverageSummaryPath)) {
      return undefined;
    }

    try {
      const coverageData = JSON.parse(
        this.context.fs.readFileSync(coverageSummaryPath, "utf8")
      );
      return {
        total: coverageData.total,
        files: Object.keys(coverageData)
          .filter(key => key !== "total")
          .reduce((acc, key) => {
            acc[key] = coverageData[key];
            return acc;
          }, {} as Record<string, any>)
      };
    } catch (error) {
      return undefined;
    }
  }
}

export default TestRunnerTool;
