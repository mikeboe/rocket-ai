import {Tool} from "./tool";
import {z} from "zod";

export function tool(func: Function, options: { name: string; description: string; queryFormat: z.ZodType<any> }) {
    return new Tool(func, options);
}
