export interface FileInfo {
  id: string;
  path: string;
  name: string;
  extension: string;
  language: string | null;
  size: number;
}

export interface FileContent extends FileInfo {
  content: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadResult {
  filesProcessed: number;
  filesSkipped: number;
  files: { path: string; name: string; language: string | null; size: number }[];
}

/** Tree node structure for file explorer */
export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: FileInfo;
}
