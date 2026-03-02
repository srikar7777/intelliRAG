import { ParsedPage } from "./pdfParser";

export interface TreeNode {
    title: string;
    page?: number;
    content?: string;
    children: TreeNode[];
}

export function buildTree(pages: ParsedPage[]): TreeNode {
    const root: TreeNode = {
        title: "Document",
        children: [],
    };

    pages.forEach((page) => {
        // Basic heuristic: lines shorter than 120 chars might be headings or paragraphs of interest
        const possibleHeadings = page.text
            .split("\n")
            .map(line => line.trim())
            .filter((line) => line.length > 0 && line.length < 120);

        // Filter out obvious garbage like single letters, page numbers alone, etc.
        const filteredHeadings = possibleHeadings.filter(h => h.length > 3 && isNaN(Number(h)));

        // Just save first 3 per page to avoid massive trees for now
        const topHeadings = filteredHeadings.slice(0, 3);
        if (topHeadings.length === 0 && page.text.trim()) {
            topHeadings.push(page.text.trim().substring(0, 50) + "...");
        }

        topHeadings.forEach((heading) => {
            root.children.push({
                title: heading,
                page: page.pageNumber,
                content: page.text,
                children: []
            });
        });
    });

    return root;
}
