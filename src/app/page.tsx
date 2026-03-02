"use client";

import { useState, useRef } from "react";
import { parsePDF, ParsedPage } from "@/lib/pdfParser";
import { buildTree, TreeNode } from "@/lib/treeBuilder";
import { queryTree } from "@/lib/pageIndexEngine";
import { loadModel } from "@/lib/llm";
import { UploadCloud, FileText, Search, Activity, Cpu, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

export default function DocumentIntelligenceApp() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [tree, setTree] = useState<TreeNode | null>(null);

  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState<TreeNode | null>(null);
  const [metrics, setMetrics] = useState<{ latency: number; nodeCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      setLoadingStep("Loading WebLLM Engine (may take a few minutes)...");
      await loadModel();

      setLoadingStep("Parsing PDF document...");
      const pages = await parsePDF(uploadedFile);

      setLoadingStep("Building Hierarchical PageIndex Tree...");
      const newTree = buildTree(pages);
      setTree(newTree);

      setLoadingStep("");
    } catch (err) {
      console.error("Error processing document:", err);
      setLoadingStep("Error occurred. Please check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const countNodes = (node: TreeNode): number => {
    let count = 1;
    for (const child of node.children) {
      count += countNodes(child);
    }
    return count;
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tree || !question.trim()) return;

    setIsAnswering(true);
    setAnswer(null);
    setMetrics(null);

    const start = performance.now();
    try {
      const result = await queryTree(tree, question);
      const end = performance.now();

      setAnswer(result || null);
      setMetrics({
        latency: end - start,
        nodeCount: countNodes(tree)
      });
    } catch (err) {
      console.error("Query failed", err);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="min-h-screen p-8 md:p-16 flex flex-col items-center max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="text-center space-y-4 w-full pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-gray-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
          Fully Client-Side AI Processing
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-glow">
          Vectorless <span className="gradient-text">Doc Intel</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Zero Backend. Zero API Cost. Zero Embeddings.
          Reasoning-based document retrieval powered entirely by your browser's WebGPU.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-12 w-full">
        {/* Left Column: Input and Tracing */}
        <div className="space-y-8 flex flex-col">
          {/* Upload Box */}
          <div className="glass-panel p-8 w-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              Document Upload
            </h2>

            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed ${file ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'} rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="application/pdf"
                className="hidden"
              />

              {file ? (
                <>
                  <FileText className="w-12 h-12 text-green-400 mb-4" />
                  <p className="font-medium text-lg">{file.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-500 mb-4" />
                  <p className="font-medium text-lg">Click to Browse PDF</p>
                  <p className="text-gray-500 text-sm mt-1">Files are processed locally in your browser</p>
                </>
              )}
            </div>

            {isProcessing && (
              <div className="mt-6 flex items-center gap-3 text-blue-400">
                <Activity className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium animate-pulse">{loadingStep}</span>
              </div>
            )}

            {tree && !isProcessing && (
              <div className="mt-6 flex items-center gap-3 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Document Indexed Successfully ({countNodes(tree)} nodes)</span>
              </div>
            )}
          </div>

          {/* Trace Panel */}
          <div className="glass-panel p-8 w-full flex-grow flex flex-col">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Reasoning Trace
            </h2>

            <div className="bg-black/40 rounded-xl p-6 border border-white/5 font-mono text-sm overflow-y-auto flex-grow h-48">
              {isAnswering ? (
                <div className="text-blue-400 animate-pulse flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  LLM reasoning over hierachical index...
                </div>
              ) : answer ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 text-gray-300">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                    <span>Analyzed user intent.</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-300">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                    <span>Traversed PageIndex mapping.</span>
                  </div>
                  <div className="flex items-start gap-2 text-green-400">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                    <span>Matched optimal section: <span className="font-bold text-white bg-white/10 px-1 py-0.5 rounded leading-relaxed">{answer.title}</span></span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 flex items-center justify-center h-full">
                  No trace active. System idling.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Query and Answer */}
        <div className="space-y-8 flex flex-col">
          {/* Query Box */}
          <div className="glass-panel p-8 w-full">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-pink-400" />
              Document Query
            </h2>
            <form onSubmit={handleQuery} className="flex gap-4">
              <input
                type="text"
                disabled={!tree || isAnswering}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={tree ? "Ask a question about the document..." : "Upload a PDF first..."}
                className="flex-grow glass-input px-4 py-3 text-sm"
              />
              <button
                type="submit"
                disabled={!tree || isAnswering || !question.trim()}
                className="glow-button px-6 py-3 flex items-center gap-2"
              >
                {isAnswering ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Ask
              </button>
            </form>
          </div>

          {/* Answer Panel */}
          <div className="glass-panel p-8 w-full flex-grow flex flex-col">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Retrieved Context
            </h2>

            <div className="bg-black/40 rounded-xl border border-white/5 p-6 flex-grow min-h-[250px] overflow-y-auto">
              {!isAnswering && answer ? (
                <div className="space-y-4">
                  <div className="inline-flex bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded text-xs font-medium uppercase tracking-wider mb-2">
                    Page {answer.page || "?"} • {answer.title}
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                    {answer.content}
                  </p>
                </div>
              ) : !isAnswering && metrics && !answer ? (
                <div className="text-yellow-500 h-full flex flex-col items-center justify-center">
                  <p>No relevant section found matching the query.</p>
                </div>
              ) : (
                <div className="text-gray-600 h-full flex flex-col items-center justify-center uppercase tracking-widest text-sm font-medium">
                  {isAnswering ? "Retrieving contextual section..." : "Awaiting Query"}
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-3 py-2 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                Latency: <span className="text-white">{metrics ? `${metrics.latency.toFixed(0)}ms` : "---"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-3 py-2 rounded-lg">
                <Activity className="w-3.5 h-3.5" />
                Nodes Scanned: <span className="text-white">{metrics ? metrics.nodeCount : "---"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
