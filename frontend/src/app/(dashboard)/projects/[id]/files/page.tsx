'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fileService } from '@/services/file.service';
import type { FileInfo, FileContent, TreeNode } from '@/types/file';

/** Build a hierarchical tree from flat file paths */
function buildFileTree(files: FileInfo[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((n) => n.name === part);

      if (existingNode) {
        currentLevel = existingNode.children;
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isDirectory: !isFile,
          children: [],
          file: isFile ? file : undefined,
        };
        currentLevel.push(newNode);
        currentLevel = newNode.children;
      }
    }
  }

  // Sort: directories first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root);

  return root;
}

/** Map language names to Prism language identifiers */
const langMap: Record<string, string> = {
  typescript: 'typescript', javascript: 'javascript', python: 'python',
  java: 'java', go: 'go', rust: 'rust', cpp: 'cpp', c: 'c',
  csharp: 'csharp', ruby: 'ruby', php: 'php', swift: 'swift',
  kotlin: 'kotlin', scala: 'scala', css: 'css', scss: 'scss',
  html: 'html', vue: 'markup', json: 'json', yaml: 'yaml',
  xml: 'xml', markdown: 'markdown', sql: 'sql', bash: 'bash',
  dockerfile: 'docker', graphql: 'graphql', prisma: 'graphql',
  toml: 'toml', text: 'text',
};

export default function FilesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await fileService.getFileTree(projectId);
      setFiles(data);
      setTree(buildFileTree(data));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP file');
      return;
    }
    setIsUploading(true);
    try {
      const result = await fileService.uploadZip(projectId, file);
      toast.success(`Uploaded ${result.filesProcessed} files (${result.filesSkipped} skipped)`);
      setSelectedFile(null);
      await fetchFiles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectFile = async (file: FileInfo) => {
    setIsLoadingFile(true);
    try {
      const content = await fileService.getFileContent(projectId, file.id);
      setSelectedFile(content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="files-header">
        <div>
          <Link href={`/projects/${projectId}`} style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Back to Project
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Code Explorer</h1>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleUpload} style={{ display: 'none' }} id="zip-upload" />
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <><div className="spinner" /> Uploading...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Upload ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : files.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6"/></svg>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>No files uploaded</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Upload a ZIP file containing your source code to get started.
          </p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload ZIP File
          </button>
        </div>
      ) : (
        <div className="explorer-layout">
          <div className="file-tree-panel card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Files ({files.length})
            </div>
            <div className="tree-scroll">
              {tree.map((node) => (
                <TreeNodeComponent
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedPath={selectedFile?.path}
                  onSelect={handleSelectFile}
                />
              ))}
            </div>
          </div>

          <div className="code-viewer-panel card">
            {isLoadingFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : selectedFile ? (
              <>
                <div className="code-header">
                  <span className="code-path">{selectedFile.path}</span>
                  <span className="code-meta">
                    {selectedFile.language && <span className="lang-badge">{selectedFile.language}</span>}
                    <span>{formatBytes(selectedFile.size)}</span>
                  </span>
                </div>
                <div className="code-content">
                  <SyntaxHighlighter
                    language={langMap[selectedFile.language || ''] || 'text'}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLongLines
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      background: 'transparent',
                      fontSize: '13px',
                      lineHeight: '1.6',
                    }}
                  >
                    {selectedFile.content}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
                Select a file to view its contents
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .files-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .explorer-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; height: calc(100vh - 180px); }
        .file-tree-panel { overflow: hidden; display: flex; flex-direction: column; }
        .tree-scroll { overflow-y: auto; flex: 1; padding: 8px 0; }
        .code-viewer-panel { overflow: hidden; display: flex; flex-direction: column; }
        .code-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap; }
        .code-path { font-size: 13px; font-weight: 500; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; }
        .code-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); }
        .lang-badge { background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .code-content { flex: 1; overflow: auto; background: var(--bg-primary); }
        @media (max-width: 768px) {
          .explorer-layout { grid-template-columns: 1fr; height: auto; }
          .file-tree-panel { max-height: 300px; }
          .code-viewer-panel { min-height: 400px; }
        }
      `}</style>
    </div>
  );
}

function TreeNodeComponent({ node, depth, selectedPath, onSelect }: {
  node: TreeNode; depth: number; selectedPath?: string; onSelect: (file: FileInfo) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: `4px 12px 4px ${12 + depth * 16}px`, background: 'none', border: 'none',
            color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-primary)" stroke="none" opacity="0.7">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{node.name}</span>
        </button>
        {isOpen && node.children.map((child) => (
          <TreeNodeComponent key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;
  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: `4px 12px 4px ${12 + depth * 16 + 18}px`,
        background: isSelected ? 'var(--bg-tertiary)' : 'none',
        border: isSelected ? 'none' : 'none',
        borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 13, cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'none'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
