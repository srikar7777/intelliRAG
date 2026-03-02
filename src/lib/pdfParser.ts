export interface ParsedPage {
    pageNumber: number;
    text: string;
}

let pdfjsLib: any = null;

async function initPdfJs() {
    if (!pdfjsLib) {
        pdfjsLib = await import("pdfjs-dist");
        // Ensure worker is available. This assumes Next.js public/ folder has the worker or we can use Cloudflare CDN.
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
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
