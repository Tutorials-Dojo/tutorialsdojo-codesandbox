import { useState } from "react";
import { ChevronDown, ChevronRight, File, Folder, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileExplorerProps {
  files: FileNode[];
  activeFile: string | null;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
}

function FileTreeItem({ 
  node, 
  level = 0, 
  activeFile, 
  onFileSelect, 
  onToggle 
}: {
  node: FileNode;
  level?: number;
  activeFile: string | null;
  onFileSelect: (file: FileNode) => void;
  onToggle: (id: string) => void;
}) {
  const isActive = activeFile === node.id;
  const paddingLeft = level * 16 + 8;

  return (
    <div>
      <div
        className={cn(
          "flex items-center h-8 cursor-pointer hover:bg-muted/50 transition-colors",
          isActive && "bg-primary-light border-r-2 border-primary"
        )}
        style={{ paddingLeft }}
        onClick={() => {
          if (node.type === 'folder') {
            onToggle(node.id);
          } else {
            onFileSelect(node);
          }
        }}
      >
        {node.type === 'folder' && (
          <div className="w-4 h-4 mr-1">
            {node.isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </div>
        )}
        {node.type === 'folder' ? (
          <Folder className="w-4 h-4 mr-2 text-primary" />
        ) : (
          <File className="w-4 h-4 mr-2 text-muted-foreground" />
        )}
        <span className={cn(
          "text-sm flex-1",
          isActive ? "text-primary font-medium" : "text-foreground"
        )}>
          {node.name}
        </span>
      </div>
      
      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ 
  files, 
  activeFile, 
  onFileSelect, 
  onCreateFile, 
  onCreateFolder 
}: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>(files);

  const handleToggle = (id: string) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateNodes(fileTree));
  };

  return (
    <div className="w-64 bg-editor-sidebar border-r border-editor-border flex flex-col">
      <div className="h-12 border-b border-editor-border flex items-center justify-between px-3">
        <span className="text-sm font-medium text-foreground">Explorer</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCreateFile}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {fileTree.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}