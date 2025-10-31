import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraphBuilder } from "./GraphBuilder";
import { Calculator } from "./Calculator";
import { TemplateManager } from "./TemplateManager";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

interface ToolsPanelProps {
  onInsertCode: (code: string) => void;
}

export const ToolsPanel = ({ onInsertCode }: ToolsPanelProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Tools">
          <Wrench className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tools</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="graph" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="calc">Calculator</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="graph" className="mt-4">
            <GraphBuilder onInsertCode={onInsertCode} />
          </TabsContent>
          
          <TabsContent value="calc" className="mt-4">
            <Calculator onInsertResult={onInsertCode} />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-4">
            <TemplateManager onInsertTemplate={onInsertCode} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
