export interface ParsedPage {
    pageNumber: number;
    text: string;
}

let pdfjsLib: any = null;

async function initPdfJs() {
    if (!pdfjsLib) {
        pdfjsLib = await import("pdfjs-dist");
        // We use v3.11.174 which is stable and widely hosted on cdnjs
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
}

export async function parsePDF(file: File): Promise<ParsedPage[]> {
    await initPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pages: ParsedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
            .map((item: any) => item.str || "")
            .join(" ");

        pages.push({
            pageNumber: i,
            text,
        });
    }

    return pages;
}
