interface WikiEditorProps {
  isEditingContent: boolean;
  blogContent: string;
  tempContent: string;
  setTempContent: (content: string) => void;
  setIsEditingContent: (val: boolean) => void;
  onSaveContent: () => void;
  projectName: string;
}

export default function WikiEditor({
  isEditingContent,
  blogContent,
  tempContent,
  setTempContent,
  setIsEditingContent,
  onSaveContent,
  projectName,
}: WikiEditorProps) {
  return (
    <article className="bg-white dark:bg-neutral-cardDark rounded-2xl p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm min-h-[400px] font-sans">
      <h2 className="text-2xl font-black mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50 text-brand-paramount dark:text-white">
        Overview
      </h2>
      {isEditingContent ? (
        <div className="space-y-4">
          <textarea 
            value={tempContent} 
            onChange={(e) => setTempContent(e.target.value)} 
            rows={12} 
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent text-slate-800 dark:text-white" 
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsEditingContent(false)} 
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button 
              onClick={onSaveContent} 
              className="px-4 py-2 bg-brand-accent text-white text-xs font-bold rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
          {blogContent}
        </div>
      )}
    </article>
  );
}