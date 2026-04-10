'use client';

import { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Settings,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
  Edit3,
  ArrowLeft,
  Save,
  X,
} from 'lucide-react';
import { useObsidian } from '@/hooks/useObsidian';
import { formatBytes, timeAgo } from '@/hooks/useMemory';
import { ObsidianIcon } from '@/components/Settings/ObsidianIcon';
import {
  VaultPanel,
  VaultPanelHeader,
  VaultSidebarItem,
  VaultEmptyState,
  MarkdownEditor,
} from '@/components/VaultView/shared';
import type { ObsidianFolder } from '@/types/electron';

type ViewMode = 'list' | 'view' | 'edit';

type TreeFileChild = { type: 'file'; name: string; relativePath: string };

function FolderTree({
  folder,
  expandedFolders,
  selectedFolder,
  onToggle,
  onSelect,
  onFileClick,
  selectedFilePath,
  depth = 0,
}: {
  folder: ObsidianFolder;
  expandedFolders: Set<string>;
  selectedFolder: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onFileClick: (filePath: string) => void;
  selectedFilePath: string | null;
  depth?: number;
}) {
  const isExpanded = expandedFolders.has(folder.relativePath);
  const isSelected = selectedFolder === folder.relativePath;
  const childFolders = folder.children.filter(
    (c): c is ObsidianFolder => 'children' in c
  );
  const childFiles = folder.children.filter(
    (c): c is TreeFileChild => 'type' in c && c.type === 'file'
  );
  const fileCount = childFiles.length;

  return (
    <div>
      <VaultSidebarItem
        selected={isSelected}
        onClick={() => {
          onToggle(folder.relativePath);
          onSelect(folder.relativePath);
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {childFolders.length > 0 ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        {isExpanded ? (
          <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-purple-500'}`} />
        ) : (
          <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-purple-500'}`} />
        )}
        <span className="truncate text-left flex-1">{folder.name}</span>
        {fileCount > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">{fileCount}</span>
        )}
      </VaultSidebarItem>

      {isExpanded && (
        <>
          {childFolders.map(child => (
            <FolderTree
              key={child.relativePath}
              folder={child}
              expandedFolders={expandedFolders}
              selectedFolder={selectedFolder}
              onToggle={onToggle}
              onSelect={onSelect}
              onFileClick={onFileClick}
              selectedFilePath={selectedFilePath}
              depth={depth + 1}
            />
          ))}
          {childFiles.map(file => (
            <SidebarFileItem
              key={file.relativePath}
              file={file}
              depth={depth + 1}
              selected={selectedFilePath === file.relativePath}
              onClick={() => onFileClick(file.relativePath)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SidebarFileItem({
  file,
  depth,
  selected,
  onClick,
}: {
  file: { name: string; relativePath: string };
  depth: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <VaultSidebarItem
      selected={selected}
      onClick={onClick}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <span className="w-3" />
      <FileText className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className="truncate text-left flex-1 text-muted-foreground">{file.name.replace(/\.md$/, '')}</span>
    </VaultSidebarItem>
  );
}

export default function ObsidianVaultView() {
  const {
    vaults,
    activeVault,
    files,
    allFiles,
    tree,
    selectedFile,
    selectedFolder,
    expandedFolders,
    searchQuery,
    loading,
    fileLoading,
    error,
    selectVault,
    openFile,
    saveFile,
    toggleFolder,
    selectFolder,
    setSearchQuery,
    setSelectedFile,
  } = useObsidian();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editContent, setEditContent] = useState('');

  const handleSelectFile = useCallback(async (filePath: string) => {
    await openFile(filePath);
    setViewMode('view');
  }, [openFile]);

  const handleSidebarFileClick = useCallback((relativePath: string) => {
    const file = allFiles.find(f => f.relativePath === relativePath);
    if (file) handleSelectFile(file.path);
  }, [allFiles, handleSelectFile]);

  const handleBack = useCallback(() => {
    setSelectedFile(null);
    setViewMode('list');
  }, [setSelectedFile]);

  const handleStartEdit = useCallback(() => {
    if (selectedFile) {
      setEditContent(selectedFile.content || '');
      setViewMode('edit');
    }
  }, [selectedFile]);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    const result = await saveFile(selectedFile.path, editContent);
    if (result?.success) {
      setViewMode('view');
    }
  }, [selectedFile, editContent, saveFile]);

  const handleCancelEdit = useCallback(() => {
    setViewMode('view');
  }, []);

  // Not configured state
  if (!loading && vaults.length === 0) {
    return (
      <VaultEmptyState
        icon={ObsidianIcon}
        title="No Obsidian Vaults Configured"
        description="Register your Obsidian vaults in Settings to browse your notes here and give agents read-only access."
        action={
          <a
            href="/settings?section=obsidian"
            className="px-4 py-2 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure in Settings
          </a>
        }
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <VaultEmptyState
        icon={AlertCircle}
        title="Error Reading Vaults"
        description={error}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — search + action, same layout as Echelon Vault */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        {viewMode === 'list' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-48 sm:w-64 lg:w-80 pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeVault && (
              <button
                onClick={() => {
                  window.electronAPI?.shell?.exec({
                    command: `open "obsidian://open?vault=${encodeURIComponent(activeVault.name)}"`,
                  });
                }}
                className="flex items-center gap-1.5 px-3 lg:px-4 py-2 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open in Obsidian</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Main Content: sidebar + content area */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Left: Vault roots + Folder tree */}
        <VaultPanel className="w-64 shrink-0 hidden lg:flex flex-col">
          <VaultPanelHeader>Vaults</VaultPanelHeader>

          <div className="flex-1 overflow-y-auto p-1.5">
            {vaults.map(vault => {
              const isActive = activeVault?.vaultPath === vault.vaultPath;
              return (
                <div key={vault.vaultPath}>
                  <VaultSidebarItem
                    selected={isActive && selectedFolder === ''}
                    onClick={() => {
                      if (isActive) {
                        selectFolder('');
                      } else {
                        selectVault(vault.vaultPath);
                      }
                    }}
                    className="px-3"
                  >
                    <ObsidianIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-[#A88BFA]'}`} />
                    <span className="truncate text-left flex-1">{vault.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{vault.files.length}</span>
                  </VaultSidebarItem>

                  {/* Show folder tree + root files under active vault */}
                  {isActive && tree && (
                    <div>
                      {tree.children
                        .filter((c): c is ObsidianFolder => 'children' in c)
                        .map(folder => (
                          <FolderTree
                            key={folder.relativePath}
                            folder={folder}
                            expandedFolders={expandedFolders}
                            selectedFolder={selectedFolder}
                            onToggle={toggleFolder}
                            onSelect={selectFolder}
                            onFileClick={handleSidebarFileClick}
                            selectedFilePath={selectedFile?.relativePath ?? null}
                            depth={2}
                          />
                        ))}
                      {/* Root-level files */}
                      {tree.children
                        .filter((c): c is TreeFileChild => 'type' in c && c.type === 'file')
                        .map(file => (
                          <SidebarFileItem
                            key={file.relativePath}
                            file={file}
                            depth={2}
                            selected={selectedFile?.relativePath === file.relativePath}
                            onClick={() => handleSidebarFileClick(file.relativePath)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Settings link */}
          <div className="px-3 py-2 border-t border-border">
            <a
              href="/settings?section=obsidian"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Configure in Settings
            </a>
          </div>
        </VaultPanel>

        {/* Content Area */}
        <VaultPanel className="flex-1 min-w-0 flex flex-col">
          {viewMode === 'list' && (
            <>
              {files.length === 0 ? (
                <VaultEmptyState
                  icon={FileText}
                  title={searchQuery ? 'No matching files' : activeVault ? 'No files in this folder' : 'Select a vault'}
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  <div className="space-y-2 p-4">
                    {files.map(file => (
                      <button
                        key={file.path}
                        onClick={() => handleSelectFile(file.path)}
                        className="w-full text-left p-3 rounded-lg border transition-all bg-card border-border hover:bg-secondary/50 hover:border-border/80"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-500" />
                          <span className="text-sm text-foreground truncate flex-1">
                            {file.name.replace(/\.md$/, '')}
                          </span>
                        </div>
                        {file.preview && (
                          <p className="text-xs text-muted-foreground mt-1 ml-5.5 line-clamp-2">
                            {file.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 ml-5.5 text-xs text-muted-foreground">
                          <span>{formatBytes(file.size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(file.lastModified)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === 'view' && (
            <>
              {fileLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : selectedFile ? (
                <>
                  {/* Viewer header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={handleBack}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-foreground truncate">
                          {selectedFile.name.replace(/\.md$/, '')}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{selectedFile.relativePath}</span>
                          <span>{formatBytes(selectedFile.size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(selectedFile.lastModified)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleStartEdit}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Frontmatter */}
                  {selectedFile.frontmatter && Object.keys(selectedFile.frontmatter).length > 0 && (
                    <div className="mx-4 mt-4 p-3 bg-secondary/50 border border-border rounded-lg text-sm shrink-0">
                      {Object.entries(selectedFile.frontmatter).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground font-mono text-xs">{key}:</span>
                          <span className="text-xs">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/90 break-words">
                      {selectedFile.content}
                    </pre>
                  </div>
                </>
              ) : (
                <VaultEmptyState
                  icon={FileText}
                  title="Select a note to view"
                />
              )}
            </>
          )}

          {viewMode === 'edit' && selectedFile && (
            <>
              {/* Editor header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-semibold text-foreground">
                    Editing: {selectedFile.name.replace(/\.md$/, '')}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>

              {/* Markdown editor */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <MarkdownEditor
                  content={editContent}
                  onChange={setEditContent}
                  placeholder="Edit your note..."
                />
              </div>
            </>
          )}
        </VaultPanel>
      </div>
    </div>
  );
}
