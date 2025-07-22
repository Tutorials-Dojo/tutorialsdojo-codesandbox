import { useEffect, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreviewProps {
  htmlContent: string;
  cssContent: string;
  jsContent: string;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export function Preview({ htmlContent, cssContent, jsContent }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');

  const getViewportDimensions = (size: ViewportSize) => {
    switch (size) {
      case 'mobile':
        return { width: '375px', height: '100%' };
      case 'tablet':
        return { width: '768px', height: '100%' };
      case 'desktop':
        return { width: '100%', height: '100%' };
    }
  };

  const updatePreview = () => {
    if (!iframeRef.current) return;
    
    setIsLoading(true);
    
    const doc = iframeRef.current.contentDocument;
    if (doc) {
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
            ${cssContent}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            try {
              ${jsContent}
            } catch (error) {
              console.error('JavaScript Error:', error);
              document.body.innerHTML += '<div style="color: red; background: #ffebee; padding: 10px; margin: 10px 0; border-radius: 4px;"><strong>JavaScript Error:</strong><br>' + error.message + '</div>';
            }
          </script>
        </body>
        </html>
      `;
      
      doc.open();
      doc.write(fullHtml);
      doc.close();
    }
    
    setTimeout(() => setIsLoading(false), 500);
  };

  useEffect(() => {
    updatePreview();
  }, [htmlContent, cssContent, jsContent]);

  const dimensions = getViewportDimensions(viewport);

  return (
    <div className="flex-1 bg-editor-preview border-l border-editor-border flex flex-col">
      <div className="h-12 border-b border-editor-border flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Preview</span>
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={viewport === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport('mobile')}
          >
            <Smartphone className="w-3 h-3" />
          </Button>
          <Button
            variant={viewport === 'tablet' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport('tablet')}
          >
            <Tablet className="w-3 h-3" />
          </Button>
          <Button
            variant={viewport === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewport('desktop')}
          >
            <Monitor className="w-3 h-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={updatePreview}>
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex justify-center">
        <div 
          className={cn(
            "transition-all duration-300 bg-white",
            viewport !== 'desktop' && "border-x border-editor-border"
          )}
          style={dimensions}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}