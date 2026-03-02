import { askLLM } from "./llm";
import { TreeNode } from "./treeBuilder";

export async function queryTree(tree: TreeNode, question: string): Promise<TreeNode | undefined> {
    const prompt = `
You are navigating a document. Here are the available sections with their IDs:

${tree.children.map((c, i) => `[ID: ${i}] ${c.title}`).join("\n")}

Question: ${question}

Analyze the options and determine which section best answers the question. 
Return ONLY the integer ID of the best matching section. Do not add any extra text.
`;

    try {
        const selected = await askLLM(prompt);

        if (selected) {
            // Robustly extract all numbers from the LLM's response
            const match = selected.match(/\d+/);
            if (match) {
                const index = parseInt(match[0], 10);
                if (!isNaN(index) && index >= 0 && index < tree.children.length) {
                    return tree.children[index];
                }
            }
        }
    } catch (err) {
        console.error("LLM reasoning error:", err);
    }

    return undefined;
}
