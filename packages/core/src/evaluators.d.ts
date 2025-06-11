import type { Evaluator } from "./types.ts";
/**
 * Template used for the evaluation generateText.
 */
export declare const evaluationTemplate: string;
/**
 * Formats the names of evaluators into a comma-separated list, each enclosed in single quotes.
 * @param evaluators - An array of evaluator objects.
 * @returns A string that concatenates the names of all evaluators, each enclosed in single quotes and separated by commas.
 */
export declare function formatEvaluatorNames(evaluators: Evaluator[]): string;
/**
 * Formats evaluator details into a string, including both the name and description of each evaluator.
 * @param evaluators - An array of evaluator objects.
 * @returns A string that concatenates the name and description of each evaluator, separated by a colon and a newline character.
 */
export declare function formatEvaluators(evaluators: Evaluator[]): string;
/**
 * Formats evaluator examples into a readable string, replacing placeholders with generated names.
 * @param evaluators - An array of evaluator objects, each containing examples to format.
 * @returns A string that presents each evaluator example in a structured format, including context, messages, and outcomes, with placeholders replaced by generated names.
 */
export declare function formatEvaluatorExamples(evaluators: Evaluator[]): string;
/**
 * Generates a string summarizing the descriptions of each evaluator example.
 * @param evaluators - An array of evaluator objects, each containing examples.
 * @returns A string that summarizes the descriptions for each evaluator example, formatted with the evaluator name, example number, and description.
 */
export declare function formatEvaluatorExampleDescriptions(evaluators: Evaluator[]): string;
//# sourceMappingURL=evaluators.d.ts.map