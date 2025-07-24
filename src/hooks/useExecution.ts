import { useState, useCallback, useEffect } from 'react';
import { executionService } from '../services/executionService';
import { useToast } from './use-toast';

interface UseExecutionOptions {
  projectId?: string;
  autoStart?: boolean;
}

export function useExecution({ projectId, autoStart = false }: UseExecutionOptions = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<string>('stopped');
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await executionService.getSandboxStatus(projectId);
      setSandboxStatus(response.execution.status);
      setSandboxUrl(response.execution.url);
      setSandboxId(response.execution.sandboxId);
    } catch (error) {
      console.error('Failed to check sandbox status:', error);
    }
  }, [projectId]);

  const startSandbox = useCallback(async () => {
    if (!projectId || isExecuting) return;

    setIsExecuting(true);
    try {
      const response = await executionService.startSandbox(projectId);
      
      if (response.success && response.execution) {
        setSandboxStatus(response.execution.status);
        setSandboxUrl(response.execution.url);
        setSandboxId(response.execution.sandboxId);
        
        toast({
          title: "Sandbox Started",
          description: "Your project is now running in a secure VM",
        });
      }
    } catch (error) {
      console.error('Failed to start sandbox:', error);
      toast({
        title: "Failed to Start",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [projectId, isExecuting, toast]);

  const stopSandbox = useCallback(async () => {
    if (!projectId || !sandboxId) return;

    try {
      await executionService.stopSandbox(projectId);
      setSandboxStatus('stopped');
      setSandboxUrl(null);
      setSandboxId(null);
      
      toast({
        title: "Sandbox Stopped",
        description: "VM has been terminated",
      });
    } catch (error) {
      console.error('Failed to stop sandbox:', error);
      toast({
        title: "Failed to Stop",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [projectId, sandboxId, toast]);

  const updateSandbox = useCallback(async () => {
    if (!projectId || !sandboxId) return;

    try {
      await executionService.updateSandbox(projectId);
      toast({
        title: "Sandbox Updated",
        description: "Your changes have been deployed",
      });
    } catch (error) {
      console.error('Failed to update sandbox:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [projectId, sandboxId, toast]);

  const executeCode = useCallback(async (files: Array<{ name: string; content: string }>, language = 'javascript') => {
    setIsExecuting(true);
    try {
      const response = await executionService.executeCode({ files, language });
      
      if (response.success && response.result) {
        return {
          output: response.result.output,
          error: response.result.error,
          executionTime: response.result.executionTime,
        };
      }
      
      throw new Error('Execution failed');
    } catch (error) {
      console.error('Code execution failed:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const fetchLogs = useCallback(async (lines = 100) => {
    if (!projectId) return;

    try {
      const response = await executionService.getExecutionLogs(projectId, lines);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (autoStart && projectId && sandboxStatus === 'stopped') {
      startSandbox();
    }
  }, [autoStart, projectId, sandboxStatus, startSandbox]);

  useEffect(() => {
    if (!projectId) return;

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, [projectId, checkStatus]);

  return {
    isExecuting,
    sandboxStatus,
    sandboxUrl,
    sandboxId,
    logs,
    startSandbox,
    stopSandbox,
    updateSandbox,
    executeCode,
    fetchLogs,
    checkStatus,
  };
}