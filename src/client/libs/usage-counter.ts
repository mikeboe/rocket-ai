import { Usage } from "../../types";

/**
 * The UsageCounter class is responsible for tracking the usage of input, output, and total tokens.
 */
export class UsageCounter {
    private inputTokens: number;
    private outputTokens: number;
    private totalTokens: number;

    /**
     * Constructs a UsageCounter instance and initializes token counts to zero.
     */
    constructor() {
        this.inputTokens = 0;
        this.outputTokens = 0;
        this.totalTokens = 0;
    }

    /**
     * Adds the usage tokens to the current counts.
     * @param {Usage} usage - The usage object containing input, output, and total tokens.
     */
    public addUsageTokens(usage: Usage) {
        this.inputTokens += usage.inputTokens;
        this.outputTokens += usage.outputTokens;
        this.totalTokens += usage.totalTokens;
    }

    /**
     * Retrieves the current usage counts.
     * @returns {Object} An object containing the counts of input, output, and total tokens.
     */
    public getUsage() {
        return {
            inputTokens: this.inputTokens,
            outputTokens: this.outputTokens,
            totalTokens: this.totalTokens
        }
    }
}