import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2 } from 'lucide-react';
import { useExecution } from '@/hooks/useExecution';

export function QuickExecute() {
  const [code, setCode] = useState('console.log("Hello from Firecracker VM!");');
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState<{
    output?: string;
    error?: string | null;
    executionTime?: number;
  } | null>(null);

  const { executeCode, isExecuting } = useExecution();

  const handleExecute = async () => {
    try {
      const files = [{ name: 'index.js', content: code }];
      const executionResult = await executeCode(files, language);
      setResult(executionResult);
    } catch (error) {
      setResult({
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Execute</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExecute} 
            disabled={isExecuting}
            className="flex items-center gap-2"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Execute
          </Button>
        </div>

        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here..."
          className="font-mono"
          rows={6}
        />

        {result && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Result {result.executionTime && `(${result.executionTime}ms)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {result.error ? (
                <pre className="text-red-600 text-sm whitespace-pre-wrap bg-red-50 p-2 rounded">
                  {result.error}
                </pre>
              ) : (
                <pre className="text-green-600 text-sm whitespace-pre-wrap bg-green-50 p-2 rounded">
                  {result.output || 'No output'}
                </pre>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}