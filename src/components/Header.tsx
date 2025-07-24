import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Save, 
  Share, 
  Play, 
  Settings, 
  User, 
  FileText, 
  Moon, 
  Sun,
  Rocket,
  Activity,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ui/theme-provider";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  projectName: string;
  onSave: () => void;
  onRun: () => void;
  onShare: () => void;
  onDeploy: () => void;
  isAutoDeployEnabled: boolean;
  onToggleAutoDeploy: (enabled: boolean) => void;
  lastSaved: Date;
  vmStatus: string;
}

export function Header({ 
  projectName, 
  onSave, 
  onRun, 
  onShare, 
  onDeploy,
  isAutoDeployEnabled,
  onToggleAutoDeploy,
  lastSaved,
  vmStatus
}: HeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const getVMStatusBadge = () => {
    const variants = {
      running: 'default',
      stopped: 'secondary',
      starting: 'outline',
      error: 'destructive',
    } as const;

    const colors = {
      running: 'text-green-600',
      stopped: 'text-gray-500',
      starting: 'text-blue-600',
      error: 'text-red-600',
    } as const;

    return (
      <Badge variant={variants[vmStatus as keyof typeof variants] || 'secondary'}>
        <Activity className={`w-3 h-3 mr-1 ${colors[vmStatus as keyof typeof colors] || 'text-gray-500'}`} />
        VM {vmStatus.charAt(0).toUpperCase() + vmStatus.slice(1)}
      </Badge>
    );
  };
  
  return (
    <header className="h-14 border-b border-editor-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TD</span>
          </div>
          <span className="font-semibold text-foreground">Tutorials Dojo</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/templates')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Templates
        </Button>
        
        <div className="text-muted-foreground">|</div>
        <span className="text-foreground font-medium">{projectName}</span>
        
        {/* VM Status */}
        <div className="flex items-center gap-2">
          {getVMStatusBadge()}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last saved: {lastSaved.toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Auto-deploy toggle */}
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md">
          <span className="text-xs text-muted-foreground">Auto-deploy</span>
          <Switch
            checked={isAutoDeployEnabled}
            onCheckedChange={onToggleAutoDeploy}
          />
        </div>

        <Button variant="ghost" size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button variant="ghost" size="sm" onClick={onRun}>
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>

        {/* Deploy button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onDeploy}
              disabled={vmStatus !== 'running'}
              className="flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Deploy
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {vmStatus === 'running' 
                ? 'Deploy changes to running VM' 
                : 'Start VM first to deploy changes'
              }
            </p>
          </TooltipContent>
        </Tooltip>

        <Button variant="outline" size="sm" onClick={onShare}>
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle {theme === "dark" ? "light" : "dark"} mode</p>
          </TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}