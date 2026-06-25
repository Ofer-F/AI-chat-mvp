import type { z } from 'zod';

export interface AssistantTool<
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny,
> {
  name: string;
  description: string;
  parameters: TParams;
  output: TOutput;
  execute(userId: string, input: z.infer<TParams>): Promise<z.infer<TOutput>>;
}
