import React, { useState, useRef, useEffect } from 'react';
import { FLOWER_THEMES, DEFAULT_AGENTS } from './constants';
import { FlowerTheme, AgentConfig, ExecutionLog, PageSection } from './types';
import { runGeminiAgent, runGeminiVisionOCR, refineTextWithAI } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { 
  Layout, Upload, FileText, Settings, PlayCircle, BarChart2, 
  BookOpen, ChevronRight, Save, Loader2, Key, FileUp, Eye, Layers, CheckCircle, AlertCircle,
  PenTool, Sparkles, X, Sidebar, ArrowRight, ChevronUp, ChevronDown, Zap, Download, FileType,
  CheckSquare, Square, RefreshCw
} from 'lucide-react';

// Type definition for PDF.js (simplified)
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const App: React.FC = () => {
  // --- State ---
  const [activeThemeName, setActiveThemeName] = useState<string>("櫻花 Cherry Blossom");
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState<PageSection>('upload');
  
  // Config State
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  
  // Data State
  const [ocrText, setOcrText] = useState<string>("");
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [notes, setNotes] = useState<string>("# Quick Notes\n\n- [ ] Check contraindications\n- [ ] Verify dosage");
  
  // Execution Selection State
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set(DEFAULT_AGENTS.map(a => a.id)));

  // UI State
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [isRefiningNotes, setIsRefiningNotes] = useState(false);
  
  // Notes AI Config State
  const [showNoteSettings, setShowNoteSettings] = useState(false);
  const [noteConfig, setNoteConfig] = useState({
    prompt: "Clean up grammar and formatting. Make it concise.",
    model: "gemini-2.5-flash",
    maxTokens: 2000
  });
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingAgentId, setProcessingAgentId] = useState<string | null>(null);
  
  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRange, setPageRange] = useState("1-3");
  const [pdfPreviews, setPdfPreviews] = useState<string[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Derived Values
  const theme: FlowerTheme = FLOWER_THEMES[activeThemeName];

  // --- Effects ---
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) setApiKey(storedKey);

    // Load Note Settings
    const storedNoteConfig = localStorage.getItem("note_ai_config");
    if (storedNoteConfig) {
      try {
        setNoteConfig(JSON.parse(storedNoteConfig));
      } catch (e) { console.error("Failed to load note config"); }
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem("gemini_api_key", e.target.value);
  };

  const saveNoteConfig = () => {
    localStorage.setItem("note_ai_config", JSON.stringify(noteConfig));
    alert("Settings Saved!");
  };

  // --- Agent Config Logic ---
  const updateAgentConfig = (index: number, field: keyof AgentConfig, value: any) => {
    const newAgents = [...agents];
    newAgents[index] = { ...newAgents[index], [field]: value };
    setAgents(newAgents);
  };

  const toggleAgentSelection = (id: string) => {
    const newSet = new Set(selectedAgentIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedAgentIds(newSet);
  };

  const toggleAllAgents = () => {
    if (selectedAgentIds.size === agents.length) {
        setSelectedAgentIds(new Set());
    } else {
        setSelectedAgentIds(new Set(agents.map(a => a.id)));
    }
  };

  // --- AI Notes Logic ---
  const handleRefineNotes = async () => {
    if (!apiKey) {
      alert("Please enter API Key first");
      return;
    }
    if (!notes.trim()) return;

    setIsRefiningNotes(true);
    try {
      const refined = await refineTextWithAI(
        apiKey, 
        notes, 
        noteConfig.prompt, 
        { model: noteConfig.model, maxTokens: noteConfig.maxTokens }
      );
      setNotes(refined);
    } catch (error) {
      alert("Failed to refine notes");
    } finally {
      setIsRefiningNotes(false);
    }
  };

  const handleMarkdownTransform = async () => {
    if (!apiKey) {
        alert("Please enter API Key first");
        return;
    }
    if (!notes.trim()) return;

    setIsRefiningNotes(true);
    try {
        const prompt = "Convert the following text into clean, well-structured Markdown. Use headers, bullet points, and bold text where appropriate to improve readability. Do not remove information.";
        const refined = await refineTextWithAI(
            apiKey,
            notes,
            prompt,
            { model: noteConfig.model, maxTokens: noteConfig.maxTokens }
        );
        setNotes(refined);
    } catch (error) {
        alert("Failed to transform to markdown");
    } finally {
        setIsRefiningNotes(false);
    }
  };

  const handleDownloadPdf = () => {
    // Create a hidden iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const content = notes
        .replace(/\n/g, '<br>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*)\*/g, '<i>$1</i>')
        .replace(/- (.*$)/gm, '<li>$1</li>');

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Notes Export</title>
                <style>
                    body { font-family: 'Noto Sans TC', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                    h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: ${theme.primary}; }
                    h2 { margin-top: 20px; color: ${theme.secondary}; }
                    li { margin-bottom: 5px; }
                    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        doc.close();
        
        // Wait for fonts to load then print
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            // Clean up
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    }
  };

  const applyNotePreset = (promptText: string) => {
    setNoteConfig(prev => ({ ...prev, prompt: promptText }));
  };

  // --- PDF Handling ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setPdfPreviews([]);
    setOcrText("");
    
    if (file.type === "application/pdf") {
      setProcessingStatus("Analyzing PDF structure...");
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        setTotalPages(pdf.numPages);
        setPageRange(`1-${Math.min(5, pdf.numPages)}`); // Default to first 5 pages max
        setProcessingStatus("PDF Loaded. Select pages to extract.");
      } catch (error) {
        console.error(error);
        alert("Error loading PDF. Please ensure it is a valid PDF file.");
      }
    } else if (file.type.startsWith("image/")) {
      // Handle single image
      setTotalPages(1);
      setPageRange("1");
      const reader = new FileReader();
      reader.onload = (e) => {
        if(e.target?.result) setPdfPreviews([e.target.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const parsePageRange = (rangeStr: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',');
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= max) pages.add(i);
          }
        }
      } else {
        const page = parseInt(part.trim());
        if (!isNaN(page) && page >= 1 && page <= max) pages.add(page);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  };

  const renderPagesToImages = async (pagesToRender: number[]): Promise<string[]> => {
    if (!pdfFile) return [];
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    const images: string[] = [];
    
    for (let i = 0; i < pagesToRender.length; i++) {
      const pageNum = pagesToRender[i];
      setProcessingStatus(`Rendering page ${pageNum}...`);
      setProcessingProgress(((i + 1) / pagesToRender.length) * 50); // First 50% is rendering
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context!, viewport }).promise;
      
      // Get clean base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      images.push(base64);
    }
    return images;
  };

  const startOCR = async () => {
    if (!apiKey) {
      alert("Please enter your Google Gemini API Key in the sidebar.");
      return;
    }
    if (!pdfFile) return;

    setIsProcessing(true);
    
    try {
      let base64Images: string[] = [];
      
      if (pdfFile.type === "application/pdf") {
        const pages = parsePageRange(pageRange, totalPages);
        if (pages.length === 0) throw new Error("Invalid page range selected.");
        if (pages.length > 20) {
            if(!confirm(`You are about to process ${pages.length} pages. This might take a while. Continue?`)) {
                setIsProcessing(false);
                return;
            }
        }
        base64Images = await renderPagesToImages(pages);
      } else {
        // It's an image already loaded in previews[0] (data url)
        if (pdfPreviews.length > 0) {
             base64Images = [pdfPreviews[0].split(',')[1]];
        }
      }

      setProcessingStatus(`Sending ${base64Images.length} images to ${selectedModel}...`);
      const text = await runGeminiVisionOCR(apiKey, selectedModel, base64Images);
      
      setOcrText(text);
      setProcessingStatus("Complete!");
      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setActiveSection('preview');
      }, 800);

    } catch (error: any) {
      alert(`OCR Failed: ${error.message}`);
      setIsProcessing(false);
      setProcessingStatus("Error occurred");
    }
  };

  // --- Pipeline ---
  const executePipeline = async () => {
    if (!ocrText) {
      alert("Please upload a document and perform OCR first.");
      setActiveSection('upload');
      return;
    }
    if (!apiKey) {
      alert("API Key missing.");
      return;
    }
    if (selectedAgentIds.size === 0) {
        alert("Please select at least one agent to run.");
        return;
    }

    setLogs([]);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    let currentInput = ocrText;

    // Filter agents based on selection
    const agentsToRun = agents.filter(a => selectedAgentIds.has(a.id));

    for (let i = 0; i < agentsToRun.length; i++) {
      const agent = agentsToRun[i];
      setProcessingAgentId(agent.id);
      setProcessingStatus(`Running Agent: ${agent.name}...`);
      
      const startTime = Date.now();
      const result = await runGeminiAgent(apiKey, agent, currentInput);
      const latency = (Date.now() - startTime) / 1000;

      const newLog: ExecutionLog = {
        agentId: agent.id,
        agentName: agent.name,
        input: currentInput,
        output: result.output,
        latency,
        tokens: result.tokens,
        timestamp: new Date().toISOString()
      };

      setLogs(prev => [...prev, newLog]);
      setProcessingProgress(((i + 1) / agentsToRun.length) * 100);
    }

    setProcessingAgentId(null);
    setIsProcessing(false);
    setActiveSection('dashboard');
  };

  // --- Render Helpers ---
  const NavButton = ({ id, icon: Icon, label }: { id: PageSection, icon: any, label: string }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden ${activeSection === id ? 'shadow-lg' : 'hover:bg-white/10'}`}
    >
      {activeSection === id && (
        <div className="absolute inset-0 opacity-100" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }} />
      )}
      <div className={`relative z-10 flex items-center gap-3 ${activeSection === id ? 'text-white font-semibold' : 'text-inherit'}`}>
        <Icon size={18} />
        <span>{label}</span>
      </div>
      {activeSection === id && <ChevronRight size={16} className="ml-auto relative z-10 text-white" />}
    </button>
  );

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-500 overflow-hidden ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
      style={{ background: darkMode ? theme.bg_dark : theme.bg_light }}
    >
      {/* Sidebar */}
      <aside className={`w-full md:w-80 p-6 flex flex-col gap-6 glass-panel z-20 border-r transition-all duration-300 ${darkMode ? 'border-white/10' : 'border-white/40'}`}>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl animate-bounce filter drop-shadow-md">{theme.icon}</div>
            <div>
                <h1 className="font-bold text-2xl leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-current to-gray-500">TFDA AI</h1>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Review System</span>
            </div>
        </div>

        {/* API Key Input */}
        <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/30'}`}>
          <div className="flex items-center gap-2 mb-2 opacity-70">
             <Key size={14} />
             <span className="text-xs font-bold uppercase tracking-wider">Gemini API Key</span>
          </div>
          <div className="relative">
            <input 
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter key..."
              className={`w-full bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2 text-sm outline-none border border-transparent focus:border-${theme.primary} transition-all`}
              style={{ borderColor: apiKey ? theme.primary : 'transparent' }}
            />
            <button 
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-2 opacity-50 hover:opacity-100"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          <NavButton id="upload" icon={Upload} label="1. Upload & OCR" />
          <NavButton id="preview" icon={FileText} label="2. Preview & Edit" />
          <NavButton id="config" icon={Settings} label="3. Agent Config" />
          <NavButton id="execute" icon={PlayCircle} label="4. Execute Pipeline" />
          <NavButton id="dashboard" icon={BarChart2} label="5. Analytics" />
          <button
            onClick={() => setShowQuickNotes(!showQuickNotes)}
            className={`mt-4 group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-300 hover:border-solid ${showQuickNotes ? 'border-current bg-current/10' : 'border-current/30 hover:border-current/60'}`}
          >
             <PenTool size={18} />
             <span className="font-semibold">Quick Notes</span>
             <div className={`ml-auto w-2 h-2 rounded-full ${showQuickNotes ? 'bg-green-500' : 'bg-transparent'}`} />
          </button>
        </nav>

        {/* Theme Settings */}
        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-white/30'} space-y-4 backdrop-blur-md shadow-sm`}>
          <div className="space-y-1">
            <label className="text-xs font-bold opacity-60 uppercase">Floral Theme</label>
            <select 
              value={activeThemeName}
              onChange={(e) => setActiveThemeName(e.target.value)}
              className="w-full bg-transparent border-b border-current/20 py-1 outline-none text-sm cursor-pointer"
            >
              {Object.keys(FLOWER_THEMES).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold opacity-60 uppercase">Dark Mode</label>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-current to-gray-400">
              {activeSection === 'upload' && 'Document Upload & OCR'}
              {activeSection === 'preview' && 'Review Extracted Content'}
              {activeSection === 'config' && 'Agent Swarm Configuration'}
              {activeSection === 'execute' && 'Intelligent Pipeline'}
              {activeSection === 'dashboard' && 'Analytics Dashboard'}
            </h2>
            <p className="opacity-60 text-sm font-medium max-w-xl">
               Powered by <span className="font-bold" style={{ color: theme.accent }}>{selectedModel}</span>. 
               {totalPages > 0 && activeSection === 'upload' && ` Loaded ${totalPages} page(s).`}
            </p>
          </div>
          
          {/* Progress Indicator (Visible when processing) */}
          {isProcessing && (
            <div className="flex items-center gap-4 bg-white/80 dark:bg-black/50 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-white/20">
               <div className="flex flex-col items-end">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">{processingStatus}</span>
                  <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                     <div 
                       className="h-full transition-all duration-300 rounded-full" 
                       style={{ width: `${processingProgress}%`, background: theme.primary }}
                     />
                  </div>
               </div>
               <Loader2 className="animate-spin" style={{ color: theme.primary }} />
            </div>
          )}
        </header>

        {/* Main Card Container */}
        <div className={`rounded-[2.5rem] shadow-2xl min-h-[600px] p-8 md:p-10 transition-all duration-500 border glass-panel ${darkMode ? 'border-white/10 shadow-black/50' : 'border-white/50 shadow-purple-100'}`}>
          
          {/* --- UPLOAD SECTION --- */}
          {activeSection === 'upload' && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Dropzone */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:scale-[1.01] transition-all duration-300 group relative overflow-hidden"
                  style={{ borderColor: theme.primary }}
                >
                   <div className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10" style={{ background: theme.primary }} />
                   <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleFileUpload} />
                   
                   <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:rotate-12 group-hover:scale-110`} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                      {isProcessing ? <Loader2 size={48} className="text-white animate-spin" /> : <FileUp size={48} className="text-white" />}
                   </div>
                   <h3 className="text-2xl font-bold mb-2">Upload PDF Document</h3>
                   <p className="opacity-60">Click or drag file to extract text</p>
                </div>
              </div>

              {/* Configuration Panel */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                 <div className={`p-6 rounded-3xl h-full ${darkMode ? 'bg-white/5' : 'bg-white/40'} backdrop-blur-md border border-white/20 flex flex-col gap-6`}>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Settings size={20} /> OCR Settings
                    </h3>
                    
                    {/* Model Selection */}
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase opacity-60">OCR Model</label>
                       <select 
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className={`w-full p-3 rounded-xl outline-none border-2 border-transparent transition-all ${darkMode ? 'bg-black/30' : 'bg-white/60'}`}
                       >
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Accuracy)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Legacy)</option>
                       </select>
                    </div>

                    {/* Page Selection */}
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase opacity-60 flex justify-between">
                         <span>Page Range</span>
                         <span className="opacity-100 text-green-600 font-mono">{totalPages > 0 ? `${totalPages} pages found` : ''}</span>
                       </label>
                       <input 
                          type="text" 
                          value={pageRange}
                          onChange={(e) => setPageRange(e.target.value)}
                          placeholder="e.g. 1-3, 5"
                          disabled={totalPages === 0}
                          className={`w-full p-3 rounded-xl outline-none border-2 border-transparent focus:border-current transition-all ${darkMode ? 'bg-black/30' : 'bg-white/60'}`}
                       />
                       <p className="text-[10px] opacity-50">Format: "1-3" for range, "1,5" for specific pages.</p>
                    </div>

                    <div className="flex-1" />
                    
                    {/* Action Button */}
                    <button 
                       onClick={startOCR}
                       disabled={!pdfFile || isProcessing}
                       className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                       style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                    >
                       {isProcessing ? (
                         <>Processing...</>
                       ) : (
                         <><Eye size={20} /> Start Vision OCR</>
                       )}
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* --- PREVIEW SECTION --- */}
          {activeSection === 'preview' && (
            <div className="h-full flex flex-col gap-4">
               <div className="flex justify-between items-center bg-white/30 dark:bg-black/20 p-2 rounded-2xl backdrop-blur-sm">
                 <div className="px-4 font-bold opacity-70">Document Content</div>
                 <div className="flex gap-2">
                    <button onClick={() => setOcrText('')} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/10 text-red-500 transition-colors">Clear</button>
                    <button onClick={() => setActiveSection('execute')} className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-105 transition-all" style={{ background: theme.accent }}>Next: Pipeline &rarr;</button>
                 </div>
               </div>
               <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/20">
                  <textarea 
                      className={`w-full h-[550px] p-8 text-lg leading-relaxed font-mono resize-none outline-none transition-colors ${darkMode ? 'bg-black/30 text-gray-300' : 'bg-white/50 text-gray-700'}`}
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      placeholder="OCR Output will appear here..."
                  />
                  {!ocrText && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                       <div className="text-center">
                          <FileText size={64} className="mx-auto mb-4" />
                          <p>No text content loaded</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* --- CONFIG SECTION --- */}
          {activeSection === 'config' && (
            <div className="grid grid-cols-1 gap-8">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg opacity-70">Agent Configuration</h3>
                  <button onClick={() => setAgents(DEFAULT_AGENTS)} className="text-xs font-bold px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2">
                      <RefreshCw size={12}/> Reset Defaults
                  </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {agents.map((agent, idx) => (
                <div key={agent.id} className={`group relative p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/40'}`}>
                  
                  {/* Header with Number */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl text-white font-bold text-lg shadow-md shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>{idx + 1}</span>
                    <div className="flex-1">
                        <input 
                            value={agent.name}
                            onChange={(e) => updateAgentConfig(idx, 'name', e.target.value)}
                            className="font-bold text-xl bg-transparent outline-none border-b border-transparent hover:border-current/20 focus:border-current w-full"
                        />
                        <input 
                            value={agent.description}
                            onChange={(e) => updateAgentConfig(idx, 'description', e.target.value)}
                            className="text-sm opacity-60 bg-transparent outline-none border-b border-transparent hover:border-current/20 focus:border-current w-full mt-1"
                        />
                    </div>
                  </div>
                  
                  {/* Prompts */}
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-white/20'}`}>
                      <label className="text-[10px] font-bold opacity-40 uppercase block mb-2 flex items-center gap-2"><Settings size={10}/> System Prompt</label>
                      <textarea 
                        value={agent.system_prompt}
                        onChange={(e) => updateAgentConfig(idx, 'system_prompt', e.target.value)}
                        className="w-full h-24 bg-transparent outline-none text-sm font-mono resize-none leading-relaxed"
                      />
                    </div>

                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-white/20'}`}>
                      <label className="text-[10px] font-bold opacity-40 uppercase block mb-2 flex items-center gap-2"><PenTool size={10}/> User Prompt (Prefix)</label>
                      <textarea 
                        value={agent.user_prompt}
                        onChange={(e) => updateAgentConfig(idx, 'user_prompt', e.target.value)}
                        className="w-full h-12 bg-transparent outline-none text-sm font-mono resize-none leading-relaxed"
                      />
                    </div>
                  
                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold opacity-40 uppercase block mb-1">Model</label>
                           <select 
                              value={agent.model}
                              onChange={(e) => updateAgentConfig(idx, 'model', e.target.value)}
                              className={`w-full p-2 rounded-lg text-xs font-bold border outline-none ${darkMode ? 'bg-black/20 border-white/10' : 'bg-white/60 border-gray-200'}`}
                           >
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold opacity-40 uppercase block mb-1">Max Tokens: {agent.max_tokens}</label>
                           <input 
                             type="range" min="100" max="8192" step="100"
                             value={agent.max_tokens}
                             onChange={(e) => updateAgentConfig(idx, 'max_tokens', parseInt(e.target.value))}
                             className="w-full accent-current h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                             style={{ accentColor: theme.accent }}
                           />
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* --- EXECUTE SECTION --- */}
          {activeSection === 'execute' && (
            <div className="flex flex-col h-full">
               {/* Initial State: Selection Mode */}
               {!isProcessing && logs.length === 0 && (
                 <div className="flex-1 flex flex-col md:flex-row gap-8">
                    {/* Left: Call to Action */}
                    <div className="flex-1 flex flex-col justify-center items-start p-8">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-pulse-soft shadow-lg" style={{ background: `${theme.primary}20` }}>
                           <Layers size={48} style={{ color: theme.accent }} />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Initialize Swarm</h3>
                        <p className="opacity-60 max-w-md mb-8 leading-relaxed">
                          Review the agents below. Select the specific agents you want to deploy for this analysis run.
                        </p>
                        <button 
                          onClick={executePipeline}
                          disabled={selectedAgentIds.size === 0}
                          className="px-10 py-4 rounded-full text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                        >
                          <PlayCircle size={24} fill="currentColor" />
                          Execute Selected ({selectedAgentIds.size})
                        </button>
                    </div>

                    {/* Right: Selection List */}
                    <div className={`flex-1 rounded-3xl border overflow-hidden flex flex-col ${darkMode ? 'bg-black/20 border-white/10' : 'bg-white/40 border-white/40'}`}>
                        <div className="p-4 border-b border-current/10 flex justify-between items-center bg-white/10">
                            <h4 className="font-bold">Agent Selection</h4>
                            <button onClick={toggleAllAgents} className="text-xs font-bold opacity-60 hover:opacity-100">
                                {selectedAgentIds.size === agents.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[400px] space-y-2 custom-scrollbar">
                            {agents.map((agent) => {
                                const isSelected = selectedAgentIds.has(agent.id);
                                return (
                                    <div 
                                        key={agent.id}
                                        onClick={() => toggleAgentSelection(agent.id)}
                                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-current/5 border-current/30' : 'border-transparent hover:bg-current/5'}`}
                                        style={{ color: isSelected ? theme.accent : 'inherit' }}
                                    >
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="opacity-30" />}
                                        <div className="flex-1">
                                            <div className={`font-bold text-sm ${isSelected ? '' : 'opacity-70'}`}>{agent.name}</div>
                                            <div className="text-[10px] opacity-50">{agent.model}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
               )}

               {/* Running/Done State: Progress List */}
               {(isProcessing || logs.length > 0) && (
               <div className="space-y-4">
                 {/* Filter to show only agents selected for this run, OR agents that have logs (history) */}
                 {agents.filter(a => selectedAgentIds.has(a.id) || logs.find(l => l.agentId === a.id)).map((agent) => {
                   const log = logs.find(l => l.agentId === agent.id);
                   const isCurrent = processingAgentId === agent.id;
                   const isPending = !log && !isCurrent;
                   
                   return (
                     <div 
                       key={agent.id}
                       className={`relative overflow-hidden p-5 rounded-2xl border flex items-center gap-5 transition-all duration-500 ${isCurrent ? 'scale-[1.02] shadow-lg bg-white/80 dark:bg-white/10 border-transparent' : 'border-transparent bg-white/40 dark:bg-white/5'} ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}`}
                     >
                        {/* Progress Bar Background for current item */}
                        {isCurrent && (
                           <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-pulse w-full" style={{ background: theme.accent }} />
                        )}

                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all ${log ? 'bg-green-500 text-white' : isCurrent ? 'bg-white text-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                           {log ? <CheckCircle size={24} /> : isCurrent ? <Loader2 size={24} className="animate-spin" style={{ color: theme.accent }} /> : <div className="w-3 h-3 rounded-full bg-current opacity-30" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between mb-1">
                             <h4 className="font-bold text-lg">{agent.name}</h4>
                             {log && <span className="text-xs font-mono opacity-50">{log.latency.toFixed(2)}s</span>}
                           </div>
                           {log ? (
                             <p className="text-sm opacity-70 truncate">{log.output.substring(0, 120)}...</p>
                           ) : (
                             <p className="text-xs opacity-40 uppercase tracking-widest font-bold">{isCurrent ? 'Reasoning...' : 'Waiting...'}</p>
                           )}
                        </div>
                     </div>
                   )
                 })}
                 
                 {/* Reset Button when done */}
                 {!isProcessing && logs.length > 0 && (
                     <div className="flex justify-center mt-8">
                         <button onClick={() => setLogs([])} className="px-6 py-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 font-bold transition-colors flex items-center gap-2">
                             <RefreshCw size={16} /> Reset Pipeline
                         </button>
                     </div>
                 )}
               </div>
               )}
            </div>
          )}

          {/* --- DASHBOARD SECTION --- */}
          {activeSection === 'dashboard' && (
            <div className="h-full">
               <Dashboard logs={logs} theme={theme} />
               
               {logs.length > 0 && (
                 <div className="mt-10 space-y-8">
                    <h3 className="text-2xl font-bold flex items-center gap-2"><FileText /> Full Analysis Logs</h3>
                    <div className="grid grid-cols-1 gap-6">
                      {logs.map((log, i) => (
                        <div key={i} className={`rounded-3xl border border-white/20 overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-white/60'}`}>
                          <div className="p-5 border-b border-white/10 flex justify-between items-center" style={{ background: `${theme.primary}15` }}>
                             <span className="font-bold text-lg" style={{ color: theme.accent }}>{log.agentName}</span>
                             <div className="flex gap-4 text-xs font-mono opacity-60">
                                <span>{log.tokens} tokens</span>
                                <span>{log.timestamp.split('T')[1].split('.')[0]}</span>
                             </div>
                          </div>
                          <div className="p-8 prose dark:prose-invert max-w-none">
                             <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed opacity-90">{log.output}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </main>

      {/* --- QUICK NOTES DRAWER --- */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col border-l ${showQuickNotes ? 'translate-x-0' : 'translate-x-full'} ${darkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}
      >
         {/* Drawer Header */}
         <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#eee' }}>
            <div className="flex items-center gap-2">
              <PenTool size={18} style={{ color: theme.accent }} />
              <h3 className="font-bold text-lg">Quick Notes</h3>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={handleDownloadPdf} 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500"
                    title="Download as PDF"
                >
                    <Download size={18} />
                </button>
                <button onClick={() => setShowQuickNotes(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500">
                  <X size={18} />
                </button>
            </div>
         </div>
         
         {/* Note Area */}
         <div className="flex-1 p-5 flex flex-col overflow-hidden">
            <textarea 
              className={`flex-1 w-full resize-none outline-none bg-transparent font-mono text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              placeholder="- Type your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
         </div>

         {/* AI Auto-Format Toolbar */}
         <div className="border-t flex flex-col" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#eee', background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
             {/* Toolbar Header / Toggle */}
             <div className="px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => setShowNoteSettings(!showNoteSettings)}>
                 <p className="text-xs font-bold uppercase opacity-60 flex items-center gap-2">
                    <Sparkles size={14} style={{ color: theme.accent }} /> 
                    AI Auto-Format
                 </p>
                 {showNoteSettings ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
             </div>
             
             {/* Configuration Panel */}
             {showNoteSettings ? (
                <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
                   
                   {/* Presets */}
                   <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button onClick={() => applyNotePreset("Fix grammar and improve readability.")} className="whitespace-nowrap px-2 py-1 text-[10px] rounded-md bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Fix Grammar</button>
                      <button onClick={() => applyNotePreset("Convert to a Markdown checklist.")} className="whitespace-nowrap px-2 py-1 text-[10px] rounded-md bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Checklist</button>
                      <button onClick={handleMarkdownTransform} disabled={isRefiningNotes} className="whitespace-nowrap px-2 py-1 text-[10px] rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-semibold flex items-center gap-1"><FileType size={10}/> To Markdown</button>
                   </div>

                   {/* Prompt Input */}
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold opacity-50">Instruction Prompt</label>
                      <textarea 
                        className={`w-full h-16 p-2 text-xs rounded-lg border resize-none ${darkMode ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'}`}
                        value={noteConfig.prompt}
                        onChange={(e) => setNoteConfig({...noteConfig, prompt: e.target.value})}
                      />
                   </div>

                   {/* Model & Token Config */}
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <label className="text-[10px] uppercase font-bold opacity-50">Model</label>
                         <select 
                           value={noteConfig.model}
                           onChange={(e) => setNoteConfig({...noteConfig, model: e.target.value})}
                           className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'}`}
                         >
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] uppercase font-bold opacity-50">Max Tokens</label>
                         <input 
                            type="number" 
                            value={noteConfig.maxTokens}
                            onChange={(e) => setNoteConfig({...noteConfig, maxTokens: parseInt(e.target.value)})}
                            className={`w-full p-1.5 text-xs rounded-lg border ${darkMode ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'}`}
                         />
                      </div>
                   </div>

                   <div className="flex gap-2 pt-1">
                      <button 
                        onClick={saveNoteConfig}
                        className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-current/10 hover:bg-current/5 transition-colors"
                      >
                        <Save size={14} /> Save Settings
                      </button>
                      <button 
                        onClick={handleRefineNotes}
                        disabled={isRefiningNotes}
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-white shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        style={{ background: theme.accent }}
                      >
                        {isRefiningNotes ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Run Format
                      </button>
                   </div>
                </div>
             ) : (
                /* Collapsed View - Quick Run */
                <div className="px-5 pb-5 pt-0">
                    <button 
                      onClick={handleRefineNotes}
                      disabled={isRefiningNotes}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: theme.accent }}
                    >
                      {isRefiningNotes ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                      Run AI Format
                    </button>
                    <p className="text-[10px] text-center mt-2 opacity-50">Using: {noteConfig.model} • {noteConfig.prompt.substring(0, 25)}...</p>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default App;