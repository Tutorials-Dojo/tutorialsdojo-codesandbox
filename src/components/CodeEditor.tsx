import { Editor } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  fileName?: string;
}

export function CodeEditor({ value, language, onChange, fileName }: CodeEditorProps) {
  const { theme } = useTheme();
  
  const getLanguageFromFileName = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'javascript';
    }
  };

  const editorLanguage = fileName ? getLanguageFromFileName(fileName) : language;

  return (
    <div className="flex-1 bg-editor-bg">
      <div className="h-10 border-b border-editor-border flex items-center px-4 bg-background">
        <span className="text-sm text-foreground">{fileName || 'Untitled'}</span>
      </div>
      
      <div className="h-[calc(100%-2.5rem)]">
        <Editor
          height="100%"
          language={editorLanguage}
          value={value}
          onChange={onChange}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            theme: theme === 'dark' ? 'vs-dark' : 'vs-light',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            glyphMargin: false,
            folding: true,
            showFoldingControls: 'always',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
          }}
        />
      </div>
    </div>
  );
}