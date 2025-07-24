import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "./Header";
import { FileExplorer, FileNode } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { ExecutionPanel } from "./execution/ExecutionPanel";
import { QuickExecute } from "./execution/QuickExecute";
import { useToast } from "@/hooks/use-toast";
import { useExecution } from "@/hooks/useExecution";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { executionService } from "@/services/executionService";

// Default project files
const defaultFiles: FileNode[] = [
  {
    id: 'index.html',
    name: 'index.html',
    type: 'file',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tutorials Dojo Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to Tutorials Dojo!</h1>
        <p>Start building your amazing project here.</p>
        <button id="clickMe">Click me!</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`
  },
  {
    id: 'styles.css',
    name: 'styles.css',
    type: 'file',
    content: `body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    padding: 40px 20px;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #fff, #ddd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

button {
    background: #1e40af;
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
}`
  },
  {
    id: 'script.js',
    name: 'script.js',
    type: 'file',
    content: `// Welcome to Tutorials Dojo JavaScript!
console.log('Welcome to Tutorials Dojo with Firecracker VM!');

document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickMe');
    let clickCount = 0;
    
    if (button) {
        button.addEventListener('click', function() {
            clickCount++;
            button.textContent = \`Clicked \${clickCount} time\${clickCount !== 1 ? 's' : ''}!\`;
            
            // Add some fun animations
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    // Add some dynamic content
    setTimeout(() => {
        const container = document.querySelector('.container');
        if (container) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.innerHTML = '<p><em>✨ Running in secure Firecracker VM! Edit files and deploy instantly.</em></p>';
            welcomeMsg.style.animation = 'fadeIn 0.5s ease-in';
            container.appendChild(welcomeMsg);
        }
    }, 1000);
});

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = \`
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
\`;
document.head.appendChild(style);`
  }
];

// Template-specific files (keeping your existing templates)
const getTemplateFiles = (templateId: string): FileNode[] => {
  switch (templateId) {
    case 'react':
    case 'react-ts':
      return [
        {
          id: 'index.html',
          name: 'index.html',
          type: 'file',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateId === 'react-ts' ? 'React TypeScript App' : 'React App'}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    ${templateId === 'react-ts' ? '<script src="https://unpkg.com/typescript@5/lib/typescript.js"></script>' : ''}
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" ${templateId === 'react-ts' ? 'data-type="module"' : ''} src="App.${templateId === 'react-ts' ? 'tsx' : 'js'}"></script>
</body>
</html>`
        },
        {
          id: templateId === 'react-ts' ? 'App.tsx' : 'App.js',
          name: templateId === 'react-ts' ? 'App.tsx' : 'App.js',
          type: 'file',
          content: templateId === 'react-ts' ? 
`import React, { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

const App: React.FC<CounterProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState<number>(initialCount);

  const handleIncrement = (): void => {
    setCount(prev => prev + 1);
  };

  const handleDecrement = (): void => {
    setCount(prev => prev - 1);
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '400px',
      margin: '50px auto',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ color: '#1e293b', marginBottom: '20px' }}>
        Welcome to React + TypeScript! 🚀
      </h1>
      <div style={{ 
        fontSize: '24px', 
        margin: '20px 0',
        color: '#475569'
      }}>
        Count: <strong style={{ color: '#3b82f6' }}>{count}</strong>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={handleDecrement}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          -
        </button>
        <button 
          onClick={handleIncrement}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>
      <p style={{ 
        marginTop: '20px', 
        color: '#64748b',
        fontSize: '14px'
      }}>
        ✨ Edit this component and see the magic happen!
      </p>
    </div>
  );
};

// @ts-ignore
ReactDOM.render(<App />, document.getElementById('root'));` :
`function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '400px',
      margin: '50px auto',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ color: '#1e293b', marginBottom: '20px' }}>
        Welcome to React! ⚛️
      </h1>
      <div style={{ 
        fontSize: '24px', 
        margin: '20px 0',
        color: '#475569'
      }}>
        Count: <strong style={{ color: '#3b82f6' }}>{count}</strong>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setCount(count - 1)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          -
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>
      <p style={{ 
        marginTop: '20px', 
        color: '#64748b',
        fontSize: '14px'
      }}>
        ✨ Edit this component and see the magic happen!
      </p>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`
        }
      ];
    // Add other template cases as needed...
    default:
      return defaultFiles;
  }
};

export function EditorLayout() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const projectName = searchParams.get('name') || 'My Awesome Project';
  const projectId = searchParams.get('projectId') || `demo-project-${Date.now()}`;
  
  const initialFiles = templateId ? getTemplateFiles(templateId) : defaultFiles;
  const [files] = useState<FileNode[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<FileNode | null>(initialFiles[0]);
  const [fileContents, setFileContents] = useState<Record<string, string>>(
    initialFiles.reduce((acc, file) => {
      if (file.content) {
        acc[file.id] = file.content;
      }
      return acc;
    }, {} as Record<string, string>)
  );
  const [isAutoDeployEnabled, setIsAutoDeployEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  const { toast } = useToast();
  const { sandboxStatus, updateSandbox } = useExecution({ projectId });

  // Auto-deploy when files change
  useEffect(() => {
    if (isAutoDeployEnabled && sandboxStatus === 'running') {
      const timeoutId = setTimeout(() => {
        handleDeploy();
      }, 2000); // Deploy 2 seconds after last change

      return () => clearTimeout(timeoutId);
    }
  }, [fileContents, isAutoDeployEnabled, sandboxStatus]);

  const handleFileSelect = useCallback((file: FileNode) => {
    setActiveFile(file);
  }, []);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setFileContents(prev => ({
        ...prev,
        [activeFile.id]: value
      }));
    }
  }, [activeFile]);

  const handleSave = useCallback(async () => {
    try {
      // In a real app, you'd save to backend here
      setLastSaved(new Date());
      
      toast({
        title: "Project saved!",
        description: "Your changes have been saved successfully.",
      });

      // Auto-deploy if enabled and VM is running
      if (isAutoDeployEnabled && sandboxStatus === 'running') {
        await handleDeploy();
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [isAutoDeployEnabled, sandboxStatus, toast]);

  const handleDeploy = useCallback(async () => {
    try {
      if (sandboxStatus !== 'running') {
        toast({
          title: "VM not running",
          description: "Start the VM first to deploy your changes.",
          variant: "destructive",
        });
        return;
      }

      // Update sandbox with current files
      await updateSandbox();
      
      toast({
        title: "Deployed!",
        description: "Your changes have been deployed to the VM.",
      });
    } catch (error) {
      toast({
        title: "Deploy failed",
        description: "Failed to deploy your changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [sandboxStatus, updateSandbox, toast]);

  const handleRun = useCallback(async () => {
    // For quick testing, we can use the executeCode function
    try {
      const vmFiles = Object.entries(fileContents).map(([id, content]) => {
        const file = files.find(f => f.id === id);
        return {
          name: file?.name || id,
          content: content || ''
        };
      });

      const result = await executionService.executeCode({
        files: vmFiles,
        language: 'javascript'
      });

      if (result.success && result.result) {
        toast({
          title: "Code executed!",
          description: `Execution time: ${result.result.executionTime}ms`,
        });
      }
    } catch (error) {
      toast({
        title: "Execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [fileContents, files, toast]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/editor?template=${templateId || 'vanilla-js'}&name=${encodeURIComponent(projectName)}&projectId=${projectId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Shareable link has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Share link",
        description: shareUrl,
      });
    });
  }, [toast, templateId, projectName, projectId]);

  const handleCreateFile = useCallback(() => {
    const fileName = prompt('Enter file name (e.g., component.js, style.css):');
    if (fileName && fileName.trim()) {
      const newFile: FileNode = {
        id: fileName,
        name: fileName,
        type: 'file',
        content: '// New file\n'
      };
      
      setFileContents(prev => ({
        ...prev,
        [fileName]: '// New file\n'
      }));
      
      toast({
        title: "File created!",
        description: `${fileName} has been created successfully.`,
      });
    }
  }, [toast]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header 
        projectName={projectName}
        onSave={handleSave}
        onRun={handleRun}
        onShare={handleShare}
        onDeploy={handleDeploy}
        isAutoDeployEnabled={isAutoDeployEnabled}
        onToggleAutoDeploy={setIsAutoDeployEnabled}
        lastSaved={lastSaved}
        vmStatus={sandboxStatus}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer
            files={files}
            activeFile={activeFile?.id || null}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFile}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Code Editor */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <CodeEditor
              value={activeFile ? (fileContents[activeFile.id] || '') : ''}
              language="javascript"
              onChange={handleCodeChange}
              fileName={activeFile?.name}
            />
            
            {/* Quick Execute Panel */}
            <div className="border-t p-4 bg-muted/30">
              <QuickExecute />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Execution Panel */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
          <ExecutionPanel 
            projectId={projectId}
            onUpdate={() => {
              // Refresh any necessary data after VM operations
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}