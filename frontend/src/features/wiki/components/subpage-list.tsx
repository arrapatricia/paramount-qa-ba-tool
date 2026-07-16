import { Page } from '../types';

interface SubpageListProps {
  pages: Page[];
  editingPageId: string | null;
  editPageTitle: string;
  setEditPageTitle: (title: string) => void;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onStartEditPage: (page: Page, e: React.MouseEvent) => void;
  onSavePageTitle: (id: string) => void;
  onDeletePage: (id: string, e: React.MouseEvent) => void;
}

export default function SubpageList({
  pages,
  editingPageId,
  editPageTitle,
  setEditPageTitle,
  onSelectPage,
  onAddPage,
  onStartEditPage,
  onSavePageTitle,
  onDeletePage,
}: SubpageListProps) {
  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sub-pages</h3>
        <button onClick={onAddPage} className="text-xs font-bold text-brand-accent hover:underline">+ New Page</button>
      </div>
      <div className="space-y-1">
        {pages.map(p => (
          <div
            key={p.id}
            onClick={() => onSelectPage(p.id)}
            className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              p.isActive 
                ? 'bg-brand-lightBg dark:bg-slate-800 text-brand-paramount dark:text-white font-bold border-l-4 border-brand-accent' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            {editingPageId === p.id ? (
              <input
                type="text"
                value={editPageTitle}
                onChange={(e) => setEditPageTitle(e.target.value)}
                onBlur={() => onSavePageTitle(p.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSavePageTitle(p.id)}
                autoFocus
                className="bg-transparent border-b border-brand-accent outline-none text-sm w-full font-bold text-slate-800 dark:text-white"
              />
            ) : (
              <span className="truncate">📝 {p.title}</span>
            )}

            {editingPageId !== p.id && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 transition-all">
                <button onClick={(e) => onStartEditPage(p, e)} className="text-slate-400 hover:text-brand-accent text-xs">✏️</button>
                <button onClick={(e) => onDeletePage(p.id, e)} className="text-slate-400 hover:text-red-500 text-xs">🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}