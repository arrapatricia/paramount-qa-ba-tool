import { useState, useRef } from 'react';
import logoDocs from '../assets/logo_docs.png'; 
import QaTestSuite from '../components/qatestsuite'; 

// --- TYPES & INTERFACES ---
interface DocPage {
  id: string;
  title: string;
  content: string;
}

interface QaSuiteItem {
  id: string;
  title: string;
}

interface ProjectSpecs {
  name: string;
  description: string;
  due: string;
  commenced: string;
  devAssignee: string;
  qaAssignee: string;
  baAssigned: string;
  status: string;
  progress: string;
}

interface DocumentationProps {
  isDarkMode: boolean;
  onBackToProjects: () => void;
  selectedProject?: any; 
}

const DEFAULT_PROJECT_SPECS: ProjectSpecs = {
  name: "New Workspace Project",
  description: "Provide a description for this project workspace...",
  due: "2026-12-31",
  commenced: "2026-07-16",
  devAssignee: "Unassigned",
  qaAssignee: "Unassigned",
  baAssigned: "Unassigned",
  status: "Active",
  progress: "Todo"
};

export default function Documentation({ isDarkMode, onBackToProjects, selectedProject }: DocumentationProps) {
  
  // Dynamic state resolver: Safely loads from either localStorage or selectedProject prop fallback
  const [projectSpecs, setProjectSpecs] = useState<ProjectSpecs>(() => {
    const cached = localStorage.getItem('qa_ba_current_project');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        name: parsed.name,
        description: parsed.about,
        due: "2026-12-31",
        commenced: parsed.createdDate,
        devAssignee: parsed.devAssignee,
        qaAssignee: parsed.qaAssignee,
        baAssigned: parsed.baAssignee,
        status: parsed.status || "Active",
        progress: "Todo"
      };
    }
    
    // Fallback if accessed out of order
    return {
      name: selectedProject?.name || DEFAULT_PROJECT_SPECS.name,
      description: selectedProject?.about || DEFAULT_PROJECT_SPECS.description,
      due: DEFAULT_PROJECT_SPECS.due,
      commenced: selectedProject?.createdDate || DEFAULT_PROJECT_SPECS.commenced,
      devAssignee: selectedProject?.devAssignee || DEFAULT_PROJECT_SPECS.devAssignee,
      qaAssignee: selectedProject?.qaAssignee || DEFAULT_PROJECT_SPECS.qaAssignee,
      baAssigned: selectedProject?.baAssignee || DEFAULT_PROJECT_SPECS.baAssigned,
      status: selectedProject?.status || DEFAULT_PROJECT_SPECS.status,
      progress: DEFAULT_PROJECT_SPECS.progress,
    };
  });

  // Dynamic user mapping for auditing logs
  const currentUser = projectSpecs.baAssigned !== "Unassigned" ? projectSpecs.baAssigned : "System User";

  // Document states
  const [pages, setPages] = useState<DocPage[]>([]);
  const [qaSuites, setQaSuites] = useState<QaSuiteItem[]>([]);

  // Editor states
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [newPageTitle, setNewPageTitle] = useState<string>('');
  const [newQaSuiteTitle, setNewQaSuiteTitle] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(true);

  // Word Tags State
  const [wordTags, setWordTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: 'Just Now', user: currentUser, action: 'Initialized clean project workspace.' }
  ]);

  const handlePageContentChange = (id: string, newContent: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddNewPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    const newId = `page-${Date.now()}`;
    const newPageObj: DocPage = {
      id: newId,
      title: newPageTitle,
      content: `<h2>📋 ${newPageTitle}</h2><hr/><p>Start typing content for ${newPageTitle} directly here...</p>`
    };
    setPages(prev => [...prev, newPageObj]);
    setNewPageTitle('');
    logAudit(`Added BA Document Page: "${newPageTitle}"`);
    setTimeout(() => scrollToSection(newId), 100);
  };

  const handleAddNewQaSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQaSuiteTitle.trim()) return;
    const newId = `qa-suite-${Date.now()}`;
    setQaSuites(prev => [...prev, { id: newId, title: newQaSuiteTitle }]);
    setNewQaSuiteTitle('');
    logAudit(`Added QA Test Suite: "${newQaSuiteTitle}"`);
    setTimeout(() => scrollToSection(newId), 100);
  };

  const updateSpecField = (field: keyof ProjectSpecs, value: string) => {
    setProjectSpecs(prev => ({ ...prev, [field]: value }));
    logAudit(`Updated ${field.replace(/([A-Z])/g, ' $1')} to "${value}"`);
  };

  const logAudit = (action: string) => {
    setAuditLogs(prev => [
      { timestamp: 'Just Now', user: currentUser, action },
      ...prev
    ]);
  };

  const handleAddWordTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim();
    if (!cleanTag) return;
    if (wordTags.includes(cleanTag)) {
      alert("Tag already exists!");
      return;
    }
    setWordTags(prev => [...prev, cleanTag]);
    setNewTagInput('');
    logAudit(`Added tag: "${cleanTag}"`);
  };

  const handleRemoveWordTag = (tagToRemove: string) => {
    setWordTags(prev => prev.filter(t => t !== tagToRemove));
    logAudit(`Removed tag: "${tagToRemove}"`);
  };

  const handleAiGenerate = async (promptText: string) => {
    if (pages.length === 0) {
      alert("Please create at least one BA Page to append AI requirements!");
      return;
    }
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const aiResponse = `
<h3>✨ AI Generated Requirement Additions</h3>
<ul>
  <li><strong>Functional Rule:</strong> The system must enforce high-security inputs before parsing data.</li>
  <li><strong>QA Assertion:</strong> Verify transaction latency returns sub-200ms payloads under peak loads.</li>
</ul>`;
    
    handlePageContentChange(pages[0].id, pages[0].content + aiResponse);
    logAudit(`Appended AI suggestion to: "${pages[0].title}"`);

    setIsGenerating(false);
    setAiPrompt('');
  };

  const formatVisual = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const insertTable = () => {
    const rowsInput = prompt("Enter number of rows:", "3");
    const colsInput = prompt("Enter number of columns:", "3");
    
    if (!rowsInput || !colsInput) return;
    const rows = parseInt(rowsInput);
    const cols = parseInt(colsInput);
    
    if (isNaN(rows) || isNaN(cols)) return;

    let tableHTML = `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; border: 1px solid #cbd5e1;">`;
    tableHTML += `<tr style="background-color: #f8fafc;">`;
    for (let j = 0; j < cols; j++) {
      tableHTML += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: bold; color: #10065F;">Header ${j + 1}</th>`;
    }
    tableHTML += `</tr>`;

    for (let i = 0; i < rows - 1; i++) {
      tableHTML += `<tr>`;
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">Data</td>`;
      }
      tableHTML += `</tr>`;
    }
    tableHTML += `</table><p></p>`;
    formatVisual('insertHTML', tableHTML);
  };

  const handleExportDoc = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tagsHtmlString = wordTags.map(tag => `<span style="background: rgba(16, 6, 95, 0.08); color: #10065F; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; margin-right: 6px;">#${tag}</span>`).join('');

    const pageHtmlSections = pages.map((p, index) => `
      <div class="print-page">
        <div class="print-header">
          <div class="logo-area">
            <div class="logo-wrapper">
              <img src="${logoDocs}" alt="Paramount Logo" style="height: 54px; width: auto; margin-right: 12px;" />
            </div>
          </div>
          <div class="doc-meta">
            <strong>PROJECT:</strong> ${projectSpecs.name}<br/>
            <strong>DATE:</strong> ${new Date().toLocaleDateString()}
          </div>
        </div>

        <div class="print-body">
          ${index === 0 && wordTags.length > 0 ? `<div style="margin-bottom: 20px;">${tagsHtmlString}</div>` : ''}
          ${p.content}
        </div>

        <div class="print-footer">
          <div class="footer-box">
            <div class="footer-page-accent">${index + 1}</div>
            <div class="footer-desc">
              <span class="desc-team">BA/QA Team  |  Systems and Development</span>
              <span class="desc-company">Paramount Life & General Insurance Inc.</span>
            </div>
          </div>
        </div>
      </div>
    `).join('<div class="page-break"></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>${projectSpecs.name} - Official BRD</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { font-family: 'Segoe UI', sans-serif; color: #1e293b; background: #f1f5f9; margin: 0; padding: 0; }
            .no-print-banner { background: #eff6ff; padding: 14px; text-align: center; font-size: 13px; color: #1e40af; font-weight: bold; border-bottom: 1px solid #bfdbfe; }
            .document-canvas { max-width: 800px; margin: 30px auto; }
            .print-page { background: white; width: 210mm; height: 297mm; box-sizing: border-box; padding: 25mm 20mm; position: relative; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
            .page-break { height: 0; page-break-after: always; }
            .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .doc-meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
            .print-body { flex-grow: 1; font-size: 13px; line-height: 1.6; color: #1e293b; }
            h2 { font-size: 18px; color: #10065F; margin-top: 0; }
            h3 { font-size: 14px; color: #10065F; }
            h4 { font-size: 12px; color: #334155; }
            ul { padding-left: 20px; }
            li { margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
            th, td { border: 1.5px solid #cbd5e1 !important; padding: 8px !important; }
            th { background-color: #f8fafc !important; font-weight: bold; color: #10065F; }
            .print-footer { padding-top: 15px; }
            .footer-box { border: 1.5px solid #10065F; display: flex; align-items: stretch; height: 48px; }
            .footer-page-accent { background-color: #10065F; color: white; width: 50px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; }
            .footer-desc { display: flex; flex-direction: column; justify-content: center; padding-left: 15px; }
            .desc-team { font-size: 11px; color: #1e293b; font-weight: bold; }
            .desc-company { font-size: 11px; color: #334155; }
            @media print {
              .no-print-banner { display: none !important; }
              body { background: white; }
              .document-canvas { margin: 0; }
              .print-page { box-shadow: none; margin-bottom: 0; page-break-inside: avoid; page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-banner">
            🖨️ Press <strong style="text-decoration: underline;">Ctrl + P</strong> and choose 'Save as PDF' to generate the official document bundle.
          </div>
          <div class="document-canvas">${pageHtmlSections}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-73px)] ${isDarkMode ? 'dark bg-neutral-obsidian text-white' : 'bg-slate-50 text-brand-paramount'}`}>
      
      {/* Utility Bar */}
      <div className="bg-slate-50 dark:bg-neutral-cardDark/40 border-b border-slate-100 dark:border-slate-800/80 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBackToProjects}
            className="text-xs font-bold text-slate-500 hover:text-brand-paramount dark:hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>← Back to Projects</span>
          </button>
          <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
          
          <button 
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {isAiPanelOpen ? '⬅️ Collapse Nav' : '📂 Open Doc Nav'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 dark:bg-neutral-cardDark/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setEditorMode('visual')}
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all uppercase tracking-wide cursor-pointer ${editorMode === 'visual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              🎨 Visual Mode
            </button>
            <button 
              onClick={() => setEditorMode('code')}
              className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all uppercase tracking-wide cursor-pointer ${editorMode === 'code' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              💻 HTML Code Mode
            </button>
          </div>

          <button 
            onClick={handleExportDoc}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            📄 Save as Docs / PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Navigation Panel */}
        {isAiPanelOpen && (
          <div className="w-72 bg-white dark:bg-neutral-cardDark/60 border-r border-slate-100 dark:border-slate-800/80 p-5 flex flex-col justify-between overflow-y-auto transition-all space-y-6">
            <div className="space-y-6">
              
              {/* BA Document Pages */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  BA Document Pages
                </h3>
                <div className="space-y-1 mb-3">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => scrollToSection(p.id)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-obsidian/40 border-l-2 border-transparent hover:border-blue-500 transition-all block truncate cursor-pointer"
                    >
                      📄 {p.title}
                    </button>
                  ))}
                  {pages.length === 0 && (
                    <p className="text-[10px] italic text-slate-400 p-2 bg-slate-50 dark:bg-neutral-obsidian/20 rounded-lg text-center">No BA pages created.</p>
                  )}
                </div>
                
                <form onSubmit={handleAddNewPage} className="flex space-x-1">
                  <input 
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Add BA Page..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white focus:outline-none"
                  />
                  <button type="submit" className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-extrabold cursor-pointer">＋</button>
                </form>
              </div>

              {/* QA Test Suites */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  QA Test Suites
                </h3>
                <div className="space-y-1 mb-3">
                  {qaSuites.map((suite) => (
                    <button
                      key={suite.id}
                      onClick={() => scrollToSection(suite.id)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-l-2 border-transparent hover:border-emerald-500 transition-all block truncate cursor-pointer"
                    >
                      🧪 {suite.title}
                    </button>
                  ))}
                  {qaSuites.length === 0 && (
                    <p className="text-[10px] italic text-slate-400 p-2 bg-slate-50 dark:bg-neutral-obsidian/20 rounded-lg text-center font-semibold text-emerald-500/80">No QA suites created.</p>
                  )}
                </div>

                <form onSubmit={handleAddNewQaSuite} className="flex space-x-1">
                  <input 
                    type="text"
                    value={newQaSuiteTitle}
                    onChange={(e) => setNewQaSuiteTitle(e.target.value)}
                    placeholder="Add QA Suite..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white focus:outline-none"
                  />
                  <button type="submit" className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold cursor-pointer">＋</button>
                </form>
              </div>

              {/* Document Tags */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Document Tags
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-24 overflow-y-auto">
                  {wordTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[10px] font-extrabold gap-1"
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveWordTag(tag)}
                        className="hover:bg-blue-500/20 text-[11px] leading-none rounded-full w-3.5 h-3.5 inline-flex items-center justify-center cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddWordTag} className="flex space-x-1">
                  <input 
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian text-brand-paramount dark:text-white focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-extrabold cursor-pointer">＋</button>
                </form>
              </div>

              {/* AI Companion */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  BA AI Companion
                </h3>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI to write specs..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-obsidian/50 text-brand-paramount dark:text-white placeholder-slate-400 h-24 resize-none"
                />
                <button
                  disabled={isGenerating || !aiPrompt.trim()}
                  onClick={() => handleAiGenerate(aiPrompt)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? '⏳ Appending...' : '✨ Append to Document'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Center: Work Canvas */}
        <div className="flex-1 flex flex-col bg-slate-100/50 dark:bg-neutral-obsidian/20 overflow-y-auto">
          
          {editorMode === 'visual' && (
            <div className="bg-white dark:bg-neutral-cardDark border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 px-6 py-2.5 flex items-center space-x-2.5 shadow-sm">
              <button onClick={() => formatVisual('bold')} className="px-2 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs font-black dark:text-white cursor-pointer">B</button>
              <button onClick={() => formatVisual('italic')} className="px-2 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs italic font-black dark:text-white cursor-pointer">I</button>
              <button onClick={() => formatVisual('underline')} className="px-2 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs underline font-black dark:text-white cursor-pointer">U</button>
              <span className="text-slate-300">|</span>
              
              <select 
                onChange={(e) => formatVisual('fontName', e.target.value)}
                className="text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-cardDark text-slate-700 dark:text-slate-200 rounded px-2 py-1 outline-none cursor-pointer"
              >
                <option value="Segoe UI">Default Font</option>
                <option value="Courier New">Typewriter (Monospace)</option>
                <option value="Georgia">Classic Serif</option>
                <option value="Arial">Modern Sans</option>
              </select>

              <span className="text-slate-300">|</span>
              <button onClick={() => formatVisual('formatBlock', '<h2>')} className="px-2.5 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-[10px] font-black dark:text-white cursor-pointer">H2</button>
              <button onClick={() => formatVisual('formatBlock', '<h3>')} className="px-2.5 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-[10px] font-black dark:text-white cursor-pointer">H3</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => formatVisual('insertUnorderedList')} className="px-2 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs dark:text-white cursor-pointer">• List</button>
              
              <span className="text-slate-300">|</span>
              <button 
                onClick={insertTable} 
                className="px-2.5 py-1 border hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs font-bold dark:text-white cursor-pointer"
              >
                Table
              </button>
            </div>
          )}

          <div className="bg-slate-50/50 dark:bg-neutral-cardDark/20 px-5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400">
            <span>Viewing: <strong className="text-slate-600 dark:text-slate-300">Continuous Workspace Scroll (Google Docs Style)</strong></span>
            <span>Highlight text to apply font or styling settings above</span>
          </div>

          <div className="p-8 max-w-4xl w-full mx-auto space-y-8 flex-1">
            {pages.map((p) => (
              <div 
                key={p.id} 
                ref={el => { sectionRefs.current[p.id] = el; }}
                className="bg-white dark:bg-neutral-cardDark border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-md p-10 min-h-[500px] flex flex-col transition-all"
              >
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-2 mb-6">
                  <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">📄 Section: {p.title}</span>
                  <span className="text-[9px] text-slate-400">Word-count aware</span>
                </div>

                {editorMode === 'visual' ? (
                  <div 
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: p.content }}
                    onBlur={(e) => handlePageContentChange(p.id, e.currentTarget.innerHTML)}
                    className="flex-1 outline-none text-xs text-brand-paramount dark:text-slate-200 prose dark:prose-invert max-w-none space-y-3 leading-relaxed"
                    style={{ minHeight: '400px' }}
                  />
                ) : (
                  <textarea
                    value={p.content}
                    onChange={(e) => handlePageContentChange(p.id, e.target.value)}
                    className="flex-1 w-full outline-none font-mono text-xs text-brand-paramount dark:text-emerald-400 bg-slate-50 dark:bg-neutral-obsidian/40 border border-slate-200 dark:border-slate-800 rounded-lg p-5 leading-relaxed"
                    style={{ minHeight: '400px' }}
                  />
                )}
              </div>
            ))}

            {/* QA Test Suites Render */}
            {qaSuites.map((suite) => (
              <div 
                key={suite.id}
                id={suite.id}
                ref={el => { sectionRefs.current[suite.id] = el; }}
                className="scroll-mt-6"
              >
                <QaTestSuite 
                  suiteId={suite.id}
                  suiteTitle={suite.title}
                  projectName={projectSpecs.name}
                  onLogAudit={logAudit} 
                />
              </div>
            ))}

            {pages.length === 0 && qaSuites.length === 0 && (
              <div className="bg-white dark:bg-neutral-cardDark border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl p-16 text-center shadow-sm">
                <span className="text-4xl">📂</span>
                <h3 className="text-sm font-bold text-brand-paramount dark:text-white mt-3">Clean Workspace Initialized</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  This project directory is currently empty. Use the sidebar on the left to add your first BA document page or QA execution suite!
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Side Specs Panel */}
        <div className="w-80 bg-slate-50/40 dark:bg-neutral-cardDark/30 overflow-y-auto p-5 flex flex-col space-y-5 font-sans">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Project Specs & Info
            </h3>
            
            <div className="bg-white dark:bg-neutral-cardDark/55 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 space-y-3 shadow-sm text-xs">
              
              {/* Project Name */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Project Name</span>
                <input 
                  type="text" 
                  value={projectSpecs.name}
                  onChange={(e) => updateSpecField('name', e.target.value)}
                  className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-extrabold text-brand-paramount dark:text-white pb-1"
                />
              </div>
              
              {/* Description */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Project Description</span>
                <textarea 
                  value={projectSpecs.description}
                  onChange={(e) => updateSpecField('description', e.target.value)}
                  className="w-full h-14 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-slate-500 dark:text-slate-300 font-semibold leading-relaxed resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Commenced</span>
                  <input 
                    type="date" 
                    value={projectSpecs.commenced}
                    onChange={(e) => updateSpecField('commenced', e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-brand-paramount dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Due Date</span>
                  <input 
                    type="date" 
                    value={projectSpecs.due}
                    onChange={(e) => updateSpecField('due', e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-red-500"
                  />
                </div>
              </div>

              {/* Assignees */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">BA Assigned</span>
                  <input 
                    type="text" 
                    value={projectSpecs.baAssigned}
                    onChange={(e) => updateSpecField('baAssigned', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-brand-paramount dark:text-slate-200 w-32"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">QA Assignee</span>
                  <input 
                    type="text" 
                    value={projectSpecs.qaAssignee}
                    onChange={(e) => updateSpecField('qaAssignee', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-brand-paramount dark:text-slate-200 w-32"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">DEV Assignee</span>
                  <input 
                    type="text" 
                    value={projectSpecs.devAssignee}
                    onChange={(e) => updateSpecField('devAssignee', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none font-bold text-brand-paramount dark:text-slate-200 w-32"
                  />
                </div>
              </div>

              {/* Status & Progress Track */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Project Status</span>
                  <select 
                    value={projectSpecs.status}
                    onChange={(e) => updateSpecField('status', e.target.value)}
                    className="bg-transparent dark:bg-neutral-cardDark font-black border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-emerald-500 text-[10px] cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Progress Track</span>
                  <div className="flex space-x-1">
                    {['Todo', 'In Progress', 'Launched'].map((track) => (
                      <button 
                        key={track}
                        onClick={() => updateSpecField('progress', track)}
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-tight transition-all cursor-pointer ${
                          projectSpecs.progress === track
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-neutral-obsidian/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Scratchpad Notes */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Local Notes / Scratchpad
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down quick reminders here..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-cardDark/55 text-brand-paramount dark:text-white placeholder-slate-400 h-24 resize-none shadow-sm focus:outline-none"
            />
          </div>

          {/* Audit Trail Logs */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Document Audit Trail
            </h3>
            <div className="flex-1 bg-white dark:bg-neutral-cardDark/55 border border-slate-100 dark:border-slate-800/50 rounded-xl p-3 overflow-y-auto space-y-2.5 min-h-[120px] shadow-sm">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-100 dark:border-slate-800/30 last:border-0 pb-2 last:pb-0 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-400 mb-0.5">
                    <span>{log.user}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-brand-paramount dark:text-slate-300 font-semibold">{log.action}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}