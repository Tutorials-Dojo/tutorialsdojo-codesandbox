// Frontend Integration artifact - ExecutionService class and interfaces
interface ExecutionRequest {
  files: Array<{
    name: string;
    content: string;
    type?: string;
  }>;
  language?: string;
  timeout?: number;
}

interface ExecutionResult {
  success: boolean;
  result?: {
    output: string;
    error: string | null;
    executionTime: number;
    vmId: string;
  };
  execution?: {
    sandboxId: string;
    url: string;
    port: number;
    status: string;
    vmType: string;
  };
  error?: string;
}

interface SandboxStatus {
  status: string;
  url: string | null;
  sandboxId: string | null;
  vmType: string;
}

class ExecutionService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    return this.request<ExecutionResult>('/execution/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async startSandbox(projectId: string): Promise<ExecutionResult> {
    return this.request<ExecutionResult>(`/execution/${projectId}/start`, {
      method: 'POST',
    });
  }

  async stopSandbox(projectId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/execution/${projectId}/stop`, {
      method: 'POST',
    });
  }

  async getSandboxStatus(projectId: string): Promise<{ success: boolean; execution: SandboxStatus }> {
    return this.request(`/execution/${projectId}/status`);
  }

  async updateSandbox(projectId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/execution/${projectId}/update`, {
      method: 'PUT',
    });
  }

  async getExecutionLogs(projectId: string, lines: number = 100): Promise<{
    success: boolean;
    logs: string[];
    sandboxId: string;
  }> {
    return this.request(`/execution/${projectId}/logs?lines=${lines}`);
  }

  async getServiceHealth(): Promise<{
    success: boolean;
    health: {
      firecracker: { version: string; status: string };
      vms: { active: number; list: any[] };
      system: { memory: any };
      timestamp: string;
    };
  }> {
    return this.request('/execution/health');
  }

  async listActiveExecutions(): Promise<{
    success: boolean;
    activeSandboxes: any[];
    total: number;
  }> {
    return this.request('/execution/active');
  }
}

export const executionService = new ExecutionService();