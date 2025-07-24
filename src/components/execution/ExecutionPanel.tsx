import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Square, RefreshCw, ExternalLink, Activity, Terminal } from 'lucide-react';
import { useExecution } from '@/hooks/useExecution';

interface ExecutionPanelProps {
  projectId: string;
  onUpdate?: () => void;
}

export function ExecutionPanel({ projectId, onUpdate }: ExecutionPanelProps) {
  const {
    sandboxStatus,
    sandboxUrl,
    sandboxId,
    logs,
    isExecuting,
    startSandbox,
    stopSandbox,
    updateSandbox,
    fetchLogs,
  } = useExecution({ projectId });

  const [activeTab, setActiveTab] = useState('preview');

  const handleStart = async () => {
    await startSandbox();
    onUpdate?.();
  };

  const handleStop = async () => {
    await stopSandbox();
    onUpdate?.();
  };

  const handleUpdate = async () => {
    await updateSandbox();
    onUpdate?.();
  };

  const handleOpenExternal = () => {
    if (sandboxUrl) {
      window.open(sandboxUrl, '_blank');
    }
  };

  const getStatusBadge = () => {
    const variants = {
      running: 'default',
      stopped: 'secondary',
      starting: 'outline',
      error: 'destructive',
    } as const;

    return (
      <Badge variant={variants[sandboxStatus as keyof typeof variants] || 'secondary'}>
        <Activity className="w-3 h-3 mr-1" />
        {sandboxStatus.charAt(0).toUpperCase() + sandboxStatus.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Execution Environment</CardTitle>
          {getStatusBadge()}
        </div>
        
        <div className="flex gap-2">
          {sandboxStatus === 'stopped' ? (
            <Button 
              onClick={handleStart} 
              disabled={isExecuting}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start VM
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleUpdate} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Update
              </Button>
              
              <Button 
                onClick={handleStop} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            </>
          )}
          
          {sandboxUrl && (
            <Button 
              onClick={handleOpenExternal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start px-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0 h-[400px]">
            {sandboxUrl ? (
              <iframe
                src={sandboxUrl}
                className="w-full h-full border-0"
                title="Project Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  {sandboxStatus === 'stopped' ? (
                    <>
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start the VM to preview your project</p>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                      <p>Starting virtual machine...</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-0 h-[400px]">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  VM Logs
                </h3>
                <Button 
                  onClick={() => fetchLogs()} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
              
              <ScrollArea className="flex-1 bg-black text-green-400 p-4 rounded font-mono text-xs">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">
                    {sandboxId ? 'No logs available' : 'Start VM to view logs'}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}