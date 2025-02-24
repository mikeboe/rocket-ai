import {z} from "zod";
import zodToJsonSchema from 'zod-to-json-schema';
import {generateSchema} from "@anatine/zod-openapi";

export class Tool {
    name: string;
    description: string;
    queryFormat: z.ZodType<any>;
    func: Function;

    constructor(func: Function, options: { name: string; description: string; queryFormat: z.ZodType<any> }) {
        this.name = options.name;
        this.description = options.description;
        this.queryFormat = options.queryFormat;
        this.func = func;
    }

    async execute(...args: any[]): Promise<any> {
        const validation = this.queryFormat.safeParse(args[0]);
        if (!validation.success) throw new Error("Invalid argument: " + validation.error.message);
        return await this.func(...args);
    }

    public getQueryFormat() {
        return JSON.stringify(generateSchema(this.queryFormat));
    }
}
