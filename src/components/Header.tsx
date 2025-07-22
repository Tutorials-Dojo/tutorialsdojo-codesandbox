import { Button } from "@/components/ui/button";
import { Save, Share, Play, Settings, User } from "lucide-react";

interface HeaderProps {
  projectName: string;
  onSave: () => void;
  onRun: () => void;
  onShare: () => void;
}

export function Header({ projectName, onSave, onRun, onShare }: HeaderProps) {
  return (
    <header className="h-14 border-b border-editor-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TD</span>
          </div>
          <span className="font-semibold text-foreground">Tutorials Dojo</span>
        </div>
        <div className="text-muted-foreground">|</div>
        <span className="text-foreground font-medium">{projectName}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="default" size="sm" onClick={onRun}>
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
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