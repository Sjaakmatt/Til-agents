import type { ToolCallRecord } from "@insiders-lab/shared";

export class ToolCallTrace {
  private readonly records: ToolCallRecord[] = [];

  async record<T>(tool: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.records.push({ tool, durationMs: Date.now() - start, succeeded: true });
      return result;
    } catch (err) {
      this.records.push({ tool, durationMs: Date.now() - start, succeeded: false });
      throw err;
    }
  }

  snapshot(): ToolCallRecord[] {
    return [...this.records];
  }

  has(tool: string): boolean {
    return this.records.some((r) => r.tool === tool);
  }
}
