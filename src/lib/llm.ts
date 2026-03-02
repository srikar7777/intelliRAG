let webllm: any = null;
let engine: any = null;

async function initWebLlm() {
    if (!webllm) {
        webllm = await import("@mlc-ai/web-llm");
    }
}

export async function loadModel() {
    await initWebLlm();
    if (!engine) {
        engine = await webllm.CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1-MLC", { initProgressCallback: (info: any) => console.log(info) });
    }
}

export async function askLLM(prompt: string) {
    await initWebLlm();
    if (!engine) await loadModel();
    const response = await engine!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}
