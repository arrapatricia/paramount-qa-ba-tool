import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoDocs from '../assets/logo_docs.png';

const API_BASE_URL = 'https://paramount-qa-ba-tool-production.up.railway.app';

interface DocPage {
  id: string;
  title: string;
  content: string;
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

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  versionName: string;
  title: string;
  content: string;
  publishedBy: string;
  publishedAt: string;
  changelogNote?: string;
  pagesSnapshot?: DocPage[];
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

  const currentUser = projectSpecs.baAssigned !== "Unassigned" ? projectSpecs.baAssigned : "System User";
  const projectId = selectedProject?.id || projectSpecs.name.toLowerCase().replace(/\s+/g, '-');

  // Document pages state
  const [pages, setPages] = useState<DocPage[]>([]);

  // Versioning States
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [changelogNote, setChangelogNote] = useState('');
  const [selectedVersionPreview, setSelectedVersionPreview] = useState<DocumentVersion | null>(null);

  // Editor states
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [newPageTitle, setNewPageTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isNavOpen, setIsNavOpen] = useState<boolean>(true);

  // Tags State
  const [wordTags, setWordTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: 'Just Now', user: currentUser, action: 'Initialized clean project workspace.' }
  ]);

  // Load Saved Version History & Active Pages
  useEffect(() => {
    const savedVersions = localStorage.getItem(`qa_doc_versions_${projectId}`);
    let loadedVersions: DocumentVersion[] = [];
    if (savedVersions) {
      try {
        loadedVersions = JSON.parse(savedVersions);
        setVersions(loadedVersions);
        if (loadedVersions.length > 0) {
          setSelectedVersionPreview(loadedVersions[0]);
          const maxVersion = Math.max(...loadedVersions.map(v => v.versionNumber || 1));
          setActiveVersionNumber(maxVersion);
        }
      } catch (e) {
        setVersions([]);
      }
    }

    const savedDoc = localStorage.getItem(`qa_doc_current_${projectId}`);
    if (savedDoc) {
      try {
        const parsed = JSON.parse(savedDoc);
        if (parsed.pages) setPages(parsed.pages);
      } catch (e) {
        console.error("Error loading active doc:", e);
      }
    }
  }, [projectId]);

  const logAudit = (action: string) => {
    setAuditLogs(prev => [
      { timestamp: 'Just Now', user: currentUser, action },
      ...prev
    ]);
  };

  const handlePageContentChange = (id: string, newContent: string) => {
    const updated = pages.map(p => p.id === id ? { ...p, content: newContent } : p);
    setPages(updated);
    localStorage.setItem(`qa_doc_current_${projectId}`, JSON.stringify({
      pages: updated,
      updatedAt: new Date().toISOString()
    }));
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
      content: `<h2>${newPageTitle}</h2><hr/><p>Start typing content for ${newPageTitle} directly here...</p>`
    };
    const updated = [...pages, newPageObj];
    setPages(updated);
    localStorage.setItem(`qa_doc_current_${projectId}`, JSON.stringify({
      pages: updated,
      updatedAt: new Date().toISOString()
    }));
    setNewPageTitle('');
    logAudit(`Added BA Document Page: "${newPageTitle}"`);
    setTimeout(() => scrollToSection(newId), 100);
  };

  const updateSpecField = (field: keyof ProjectSpecs, value: string) => {
    setProjectSpecs(prev => ({ ...prev, [field]: value }));
    logAudit(`Updated ${field.replace(/([A-Z])/g, ' $1')} to "${value}"`);
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

  // 🚀 Save New Snapshot Version with Correct Increment
  const handlePublishNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pages.length === 0) {
      alert("Please create document content before saving a version snapshot.");
      return;
    }

    const maxExisting = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber || 0)) : 0;
    const nextVerNumber = maxExisting + 1;

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
                          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newVersion: DocumentVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: nextVerNumber,
      versionName: `v${nextVerNumber}.0`,
      title: `${projectSpecs.name} - Version ${nextVerNumber}.0`,
      content: pages.map(p => p.content).join('<hr/>'),
      publishedBy: currentUser,
      publishedAt: formattedDate,
      changelogNote: changelogNote.trim() || 'Saved updated specifications version.',
      pagesSnapshot: JSON.parse(JSON.stringify(pages))
    };

    try {
      await axios.post(`${API_BASE_URL}/projects/${projectId}/versions`, newVersion).catch(() => {
        console.warn("API fallback to local storage for version save");
      });
    } catch (e) {
      console.warn("Version save fallback:", e);
    }

    const updatedVersions = [newVersion, ...versions];
    setVersions(updatedVersions);
    setActiveVersionNumber(nextVerNumber);
    setSelectedVersionPreview(newVersion);

    localStorage.setItem(`qa_doc_versions_${projectId}`, JSON.stringify(updatedVersions));
    logAudit(`Saved Document Version Snapshot ${newVersion.versionName}`);

    setIsPublishModalOpen(false);
    setChangelogNote('');
    alert(`Document version v${nextVerNumber}.0 saved successfully!`);
  };

  // 🔄 Revert to Past Historical Version
  const handleRevertToVersion = (version: DocumentVersion) => {
    if (!confirm(`Are you sure you want to revert to ${version.versionName} (${version.publishedAt})? Current unsaved changes will be replaced.`)) {
      return;
    }

    if (version.pagesSnapshot && version.pagesSnapshot.length > 0) {
      setPages(version.pagesSnapshot);
    } else if (version.content) {
      setPages([{
        id: `page-${Date.now()}`,
        title: 'Restored Content Page',
        content: version.content
      }]);
    }

    setActiveVersionNumber(version.versionNumber);
    logAudit(`Reverted workspace documentation to ${version.versionName}`);

    localStorage.setItem(`qa_doc_current_${projectId}`, JSON.stringify({
      pages: version.pagesSnapshot || pages,
      versionNumber: version.versionNumber,
      updatedAt: new Date().toISOString()
    }));

    setIsVersionHistoryOpen(false);
    alert(`Document successfully reverted to ${version.versionName}!`);
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
            <strong>VERSION:</strong> v${activeVersionNumber}.0<br/>
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
            Press <strong>Ctrl + P</strong> and choose 'Save as PDF' to generate the official document bundle.
          </div>
          <div class="document-canvas">${pageHtmlSections}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-73px)] ${isDarkMode ? 'dark bg-[#080C14] text-white' : 'bg-[#EBF1F6] text-slate-900'}`}>
      
      {/* Utility Bar */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800/80 px-4 md:px-6 py-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToProjects}
            className="text-xs font-bold text-slate-500 hover:text-[#10065F] dark:hover:text-white flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
          >
            <span>&larr; Back to Projects</span>
          </button>
          <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
          
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-white/60 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap shadow-xs"
          >
            {isNavOpen ? 'Collapse Nav' : 'Open Doc Nav'}
          </button>

          <span className="text-xs text-slate-300 dark:text-slate-600">|</span>

          {/* VERSION BADGE */}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 backdrop-blur-md">
            v{activeVersionNumber}.0
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={() => setIsVersionHistoryOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white transition-all cursor-pointer shadow-xs backdrop-blur-md"
          >
            History & Versions ({versions.length})
          </button>

          {/* 🔘 ICON-ONLY SAVE VERSION BUTTON */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-[#10065F] to-[#1a0a80] dark:from-blue-600 dark:to-indigo-600 text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
            title="Save New Version Snapshot"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          <div className="flex bg-white/40 dark:bg-slate-950/40 p-1 rounded-lg border border-slate-200 dark:border-slate-700 backdrop-blur-md">
            <button 
              onClick={() => setEditorMode('visual')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[10px] font-extrabold transition-all uppercase tracking-wide cursor-pointer ${editorMode === 'visual' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Visual Mode
            </button>
            <button 
              onClick={() => setEditorMode('code')}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-[10px] font-extrabold transition-all uppercase tracking-wide cursor-pointer ${editorMode === 'code' ? 'bg-[#10065F] dark:bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
            >
              HTML Mode
            </button>
          </div>

          <button 
            onClick={handleExportDoc}
            className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap backdrop-blur-md"
          >
            Save as Docs / PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden">
        
        {/* Left Side Navigation Panel */}
        {isNavOpen && (
          <div className="w-full xl:w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b xl:border-b-0 xl:border-r border-white/80 dark:border-slate-800/80 p-4 md:p-5 flex flex-col justify-between overflow-y-auto transition-all space-y-6 shrink-0">
            <div className="space-y-6">
              
              {/* BA Document Pages */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  BA Document Pages
                </h3>
                <div className="space-y-1 mb-3 max-h-48 xl:max-h-none overflow-y-auto pr-1">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => scrollToSection(p.id)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 border-l-2 border-transparent hover:border-[#10065F] transition-all block truncate cursor-pointer"
                    >
                      {p.title}
                    </button>
                  ))}
                  {pages.length === 0 && (
                    <p className="text-[10px] italic text-slate-400 p-2 bg-white/40 dark:bg-slate-950/20 rounded-lg text-center">No BA pages created.</p>
                  )}
                </div>
                
                <form onSubmit={handleAddNewPage} className="flex space-x-1">
                  <input 
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Add BA Page..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none min-w-0"
                  />
                  <button type="submit" className="px-2.5 py-1.5 bg-[#10065F] dark:bg-blue-600 text-white rounded-lg text-xs font-extrabold cursor-pointer shrink-0">+</button>
                </form>
              </div>

              {/* Document Tags */}
              <div className="border-t border-white/60 dark:border-slate-800/80 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Document Tags
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-24 overflow-y-auto">
                  {wordTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-[#10065F] dark:text-blue-400 text-[10px] font-extrabold gap-1 border border-blue-500/20 backdrop-blur-md"
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveWordTag(tag)}
                        className="hover:bg-blue-500/20 text-[11px] leading-none rounded-full w-3.5 h-3.5 inline-flex items-center justify-center cursor-pointer"
                      >
                        ✕
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
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-none min-w-0"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#10065F] dark:bg-blue-600 text-white rounded-lg text-xs font-extrabold cursor-pointer shrink-0">+</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Center Work Canvas */}
        <div className="flex-1 flex flex-col bg-transparent overflow-y-auto min-w-0">
          
          {editorMode === 'visual' && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/80 dark:border-slate-800 sticky top-0 z-10 px-4 md:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shadow-xs no-scrollbar">
              <button onClick={() => formatVisual('bold')} className="px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-xs font-black dark:text-white cursor-pointer shrink-0">B</button>
              <button onClick={() => formatVisual('italic')} className="px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-xs italic font-black dark:text-white cursor-pointer shrink-0">I</button>
              <button onClick={() => formatVisual('underline')} className="px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-xs underline font-black dark:text-white cursor-pointer shrink-0">U</button>
              <span className="text-slate-300 shrink-0">|</span>
              
              <select 
                onChange={(e) => formatVisual('fontName', e.target.value)}
                className="text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 rounded px-2 py-1 outline-none cursor-pointer shrink-0"
              >
                <option value="Segoe UI" className="dark:bg-slate-900">Default Font</option>
                <option value="Courier New" className="dark:bg-slate-900">Typewriter (Monospace)</option>
                <option value="Georgia" className="dark:bg-slate-900">Classic Serif</option>
                <option value="Arial" className="dark:bg-slate-900">Modern Sans</option>
              </select>

              <span className="text-slate-300 shrink-0">|</span>
              <button onClick={() => formatVisual('formatBlock', '<h2>')} className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-[10px] font-black dark:text-white cursor-pointer shrink-0">H2</button>
              <button onClick={() => formatVisual('formatBlock', '<h3>')} className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-[10px] font-black dark:text-white cursor-pointer shrink-0">H3</button>
              <span className="text-slate-300 shrink-0">|</span>
              <button onClick={() => formatVisual('insertUnorderedList')} className="px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-xs dark:text-white cursor-pointer shrink-0">• List</button>
              
              <span className="text-slate-300 shrink-0">|</span>
              <button 
                onClick={insertTable} 
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded text-xs font-bold dark:text-white cursor-pointer shrink-0"
              >
                Table
              </button>
            </div>
          )}

          <div className="px-4 md:px-5 py-1.5 border-b border-white/60 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-400 gap-1 bg-white/30 dark:bg-slate-950/20 backdrop-blur-md">
            <span>Viewing: <strong className="text-[#10065F] dark:text-blue-400">Continuous Workspace Scroll (v{activeVersionNumber}.0 Active)</strong></span>
            <span className="hidden sm:inline">Highlight text to apply formatting tools above</span>
          </div>

          <div className="p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6 md:space-y-8 flex-1">
            {pages.map((p) => (
              <div 
                key={p.id} 
                ref={el => { sectionRefs.current[p.id] = el; }}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 rounded-[28px] shadow-xl shadow-black/5 p-5 sm:p-8 md:p-10 min-h-[400px] md:min-h-[500px] flex flex-col transition-all"
              >
                <div className="flex justify-between items-center border-b border-white/60 dark:border-slate-800/80 pb-2 mb-4 md:mb-6">
                  <span className="text-[10px] font-black tracking-widest text-[#10065F] dark:text-blue-400 uppercase truncate">Section: {p.title}</span>
                  <span className="text-[9px] text-slate-400 shrink-0">v{activeVersionNumber}.0 Document Scope</span>
                </div>

                {editorMode === 'visual' ? (
                  <div 
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: p.content }}
                    onBlur={(e) => handlePageContentChange(p.id, e.currentTarget.innerHTML)}
                    className="flex-1 outline-none text-xs text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none space-y-3 leading-relaxed"
                    style={{ minHeight: '300px' }}
                  />
                ) : (
                  <textarea
                    value={p.content}
                    onChange={(e) => handlePageContentChange(p.id, e.target.value)}
                    className="flex-1 w-full outline-none font-mono text-xs text-slate-800 dark:text-emerald-400 bg-white/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 md:p-5 leading-relaxed shadow-inner"
                    style={{ minHeight: '300px' }}
                  />
                )}
              </div>
            ))}

            {pages.length === 0 && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-dashed border-slate-300 dark:border-slate-700 rounded-[28px] p-8 md:p-16 text-center shadow-xl shadow-black/5">
                <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">Clean Workspace Initialized</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  This project directory is currently empty. Use the sidebar menu to add your first BA document page.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Side Specs Panel */}
        <div className="w-full xl:w-80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl overflow-y-auto p-4 md:p-5 flex flex-col space-y-5 font-sans shrink-0 border-t xl:border-t-0 xl:border-l border-white/80 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Project Specs & Info
            </h3>
            
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 rounded-[24px] p-4 space-y-3 shadow-xs text-xs">
              
              {/* Project Name */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Project Name</span>
                <input 
                  type="text" 
                  value={projectSpecs.name}
                  onChange={(e) => updateSpecField('name', e.target.value)}
                  className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-extrabold text-[#10065F] dark:text-white pb-1"
                />
              </div>
              
              {/* Description */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Project Description</span>
                <textarea 
                  value={projectSpecs.description}
                  onChange={(e) => updateSpecField('description', e.target.value)}
                  className="w-full h-14 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none text-slate-600 dark:text-slate-300 font-semibold leading-relaxed resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/60 dark:border-slate-800/80 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Commenced</span>
                  <input 
                    type="date" 
                    value={projectSpecs.commenced}
                    onChange={(e) => updateSpecField('commenced', e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-bold text-[#10065F] dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Due Date</span>
                  <input 
                    type="date" 
                    value={projectSpecs.due}
                    onChange={(e) => updateSpecField('due', e.target.value)}
                    className="w-full bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-bold text-rose-500"
                  />
                </div>
              </div>

              {/* Assignees */}
              <div className="border-t border-white/60 dark:border-slate-800/80 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">BA Assigned</span>
                  <input 
                    type="text" 
                    value={projectSpecs.baAssigned}
                    onChange={(e) => updateSpecField('baAssigned', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-bold text-slate-800 dark:text-slate-200 w-32"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">QA Assignee</span>
                  <input 
                    type="text" 
                    value={projectSpecs.qaAssignee}
                    onChange={(e) => updateSpecField('qaAssignee', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-bold text-slate-800 dark:text-slate-200 w-32"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">DEV Assignee</span>
                  <input 
                    type="text" 
                    value={projectSpecs.devAssignee}
                    onChange={(e) => updateSpecField('devAssignee', e.target.value)}
                    className="bg-transparent text-right border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-[#10065F] outline-none font-bold text-slate-800 dark:text-slate-200 w-32"
                  />
                </div>
              </div>

              {/* Status & Progress Track */}
              <div className="border-t border-white/60 dark:border-slate-800/80 pt-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Project Status</span>
                  <select 
                    value={projectSpecs.status}
                    onChange={(e) => updateSpecField('status', e.target.value)}
                    className="bg-transparent dark:bg-slate-900 font-black border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-emerald-500 text-[10px] cursor-pointer"
                  >
                    <option value="Active" className="dark:bg-slate-900">Active</option>
                    <option value="Completed" className="dark:bg-slate-900">Completed</option>
                    <option value="On Hold" className="dark:bg-slate-900">On Hold</option>
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
                            ? 'bg-[#10065F] dark:bg-blue-600 text-white'
                            : 'bg-white/50 dark:bg-slate-950/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
              className="w-full p-3 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 text-slate-800 dark:text-white placeholder-slate-400 h-24 resize-none shadow-xs focus:outline-none backdrop-blur-md"
            />
          </div>

          {/* Audit Trail Logs */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Document Audit Trail
            </h3>
            <div className="flex-1 bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-800/80 rounded-2xl p-3 overflow-y-auto space-y-2.5 min-h-[120px] max-h-48 xl:max-h-none shadow-xs backdrop-blur-xl">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="border-b border-white/60 dark:border-slate-800/50 last:border-0 pb-2 last:pb-0 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-400 mb-0.5">
                    <span>{log.user}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-[#10065F] dark:text-slate-300 font-semibold">{log.action}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 🚀 MODAL: SAVE NEW VERSION SNAPSHOT WITH CHANGELOG */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 dark:border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">
                  Save Document Version v{(versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber || 0)) : 0) + 1}.0
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Create a permanent baseline snapshot that can be reverted anytime.</p>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 font-bold cursor-pointer hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePublishNewVersion} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase text-[10px] tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Changelog Note / Release Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={changelogNote}
                  onChange={(e) => setChangelogNote(e.target.value)}
                  placeholder="e.g. Added auth endpoint validation rules and revised error codes."
                  className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-950/40 text-slate-800 dark:text-white font-semibold outline-none resize-none shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 border rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#10065F] hover:bg-[#180A8C] dark:bg-blue-600 text-white font-black uppercase tracking-wider rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  Confirm & Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔄 MODAL/DRAWER: VERSION HISTORY & REVERT PANEL */}
      {isVersionHistoryOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[85vh] bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 dark:border-slate-700/80 shadow-2xl flex flex-col justify-between space-y-4 overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-black text-[#10065F] dark:text-white uppercase tracking-wider">
                  Document Version History & Rollback Ledger
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Review past saved snapshots and revert active document state.</p>
              </div>
              <button onClick={() => setIsVersionHistoryOpen(false)} className="text-slate-400 font-bold cursor-pointer hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            {/* TWO COLUMN PREVIEW & REVERT MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
              
              {/* LEFT: VERSION TIMELINE LIST */}
              <div className="md:col-span-1 space-y-2 overflow-y-auto pr-1">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionPreview(ver)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                      selectedVersionPreview?.id === ver.id
                        ? 'bg-[#10065F] dark:bg-blue-600 text-white border-transparent shadow-md'
                        : 'bg-white/50 dark:bg-slate-950/40 border-white/80 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-xs">{ver.versionName}</span>
                      <span className="text-[9px] font-bold opacity-75">{ver.publishedAt}</span>
                    </div>
                    <p className="text-[11px] font-semibold truncate">{ver.changelogNote}</p>
                    <span className="text-[9px] block opacity-75">By {ver.publishedBy}</span>
                  </div>
                ))}

                {versions.length === 0 && (
                  <p className="text-xs text-slate-400 italic p-4 text-center">
                    No versions saved yet. Click the save icon to create your first baseline snapshot.
                  </p>
                )}
              </div>

              {/* RIGHT: SELECTED SNAPSHOT CONTENT INSPECTOR */}
              <div className="md:col-span-2 bg-white/50 dark:bg-slate-950/40 rounded-2xl border border-white/80 dark:border-slate-800/80 p-4 flex flex-col justify-between space-y-3 overflow-hidden">
                {selectedVersionPreview ? (
                  <>
                    <div className="space-y-2 overflow-y-auto pr-1">
                      <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800 pb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                            PREVIEWING {selectedVersionPreview.versionName}
                          </span>
                          <h4 className="font-bold text-sm text-[#10065F] dark:text-white">
                            {selectedVersionPreview.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {selectedVersionPreview.publishedAt}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
                        Changelog: {selectedVersionPreview.changelogNote}
                      </p>

                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedVersionPreview.content }} 
                        className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    {/* REVERT ACTION BUTTON */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end shrink-0">
                      <button
                        onClick={() => handleRevertToVersion(selectedVersionPreview)}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Revert Active Document to {selectedVersionPreview.versionName}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center text-xs text-slate-400 italic">
                    Select a version on the left to inspect content and trigger a rollback.
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setIsVersionHistoryOpen(false)}
                className="px-5 py-2.5 border rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}