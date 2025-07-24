import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Code, Zap, Globe, Server, Database, Smartphone, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  usageCount: number;
  preview?: string;
}

const templates: Template[] = [
  {
    id: "react",
    name: "React",
    description: "React example starter project",
    icon: "⚛️",
    category: "Frontend",
    tags: ["React", "JavaScript", "SPA"],
    usageCount: 8400000
  },
  {
    id: "vanilla-js",
    name: "JavaScript",
    description: "The JavaScript template",
    icon: "🟨",
    category: "Frontend",
    tags: ["Vanilla", "JavaScript", "ES6"],
    usageCount: 3400000
  },
  {
    id: "html-css",
    name: "HTML + CSS",
    description: "A template for HTML and CSS",
    icon: "🌐",
    category: "Frontend",
    tags: ["HTML", "CSS", "Static"],
    usageCount: 2700000
  },
  {
    id: "react-ts",
    name: "React (TS)",
    description: "React and TypeScript example starter project",
    icon: "⚛️",
    category: "Frontend",
    tags: ["React", "TypeScript", "SPA"],
    usageCount: 995500
  },
  {
    id: "vanilla-ts",
    name: "Vanilla TypeScript",
    description: "JavaScript and TypeScript example starter project",
    icon: "🔷",
    category: "Frontend",
    tags: ["TypeScript", "Vanilla", "ES6"],
    usageCount: 315900
  },
  {
    id: "node-express",
    name: "Node.js Express",
    description: "Node.js with Express server starter project",
    icon: "🟢",
    category: "Backend",
    tags: ["Node.js", "Express", "API"],
    usageCount: 243200
  },
  {
    id: "next-js",
    name: "Next.js",
    description: "Full-stack React framework with SSR",
    icon: "▲",
    category: "Full Stack",
    tags: ["Next.js", "React", "SSR"],
    usageCount: 180500
  },
  {
    id: "vue",
    name: "Vue.js",
    description: "Progressive JavaScript framework",
    icon: "🔧",
    category: "Frontend",
    tags: ["Vue", "JavaScript", "SPA"],
    usageCount: 156700
  }
];

const categories = [
  { name: "Popular", icon: Zap },
  { name: "Frontend", icon: Globe },
  { name: "Backend", icon: Server },
  { name: "Full Stack", icon: Code },
  { name: "Database", icon: Database },
  { name: "Mobile", icon: Smartphone }
];

const Templates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Popular");
  const navigate = useNavigate();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "Popular" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleCreateProject = (templateId: string) => {
    // Create project with selected template
    const projectName = `New ${templates.find(t => t.id === templateId)?.name || 'Project'}`;
    navigate(`/editor?template=${templateId}&name=${encodeURIComponent(projectName)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tutorials Dojo templates</h1>
              <p className="text-muted-foreground mt-2">Start your new project with one of our official templates.</p>
            </div>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Editor
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Categories and Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
                className="flex items-center gap-2"
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </Button>
            ))}
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Zap className="w-3 h-3" />
                    {formatUsageCount(template.usageCount)}
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handleCreateProject(template.id)}
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">Try adjusting your search or selecting a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;