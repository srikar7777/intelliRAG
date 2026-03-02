import { askLLM } from "./llm";
import { TreeNode } from "./treeBuilder";

export async function queryTree(tree: TreeNode, question: string): Promise<TreeNode | undefined> {
    const prompt = `
You are navigating a structured engineering document.

Here are the available sections:
${tree.children.map((c) => c.title).join("\n")}

Question: ${question}

Select the most relevant section and explain briefly why. Return ONLY the exact section title that matches best from the list above, nothing else. Do not add quotes or markdown blocks.
`;

    try {
        const selected = await askLLM(prompt);

        if (selected) {
            // Basic matching
            const matched = tree.children.find((c) => selected.includes(c.title));
            if (matched) return matched;

            // Fallback: If partial match or string containment
            const fallbackMatched = tree.children.find((c) => c.title.includes(selected) || selected.includes(c.title));
            return fallbackMatched;
        }
    } catch (err) {
        console.error("LLM reasoning error:", err);
    }

    return undefined;
}
