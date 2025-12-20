"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Code2,
  FormInput,
  Plus,
  Trash2,
  Terminal,
  Package,
} from "lucide-react";
import { PackageSearchInput } from "./package-search-input";
import { WorkerDefinition } from "@/app/interface/scheduler-api/assignment";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface WorkerDefinitionEditorProps {
  value: WorkerDefinition;
  onChange: (value: WorkerDefinition) => void;
}

type EditorMode = "form" | "json";

export function WorkerDefinitionEditor({
  value,
  onChange,
}: WorkerDefinitionEditorProps) {
  const [mode, setMode] = useState<EditorMode>("form");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleDependenciesChange = (dependencies: string[]) => {
    onChange({ ...value, dependencies });
  };

  const handleStartCommandAdd = () => {
    onChange({
      ...value,
      startCommands: [...value.startCommands, ""],
    });
  };

  const handleStartCommandChange = (index: number, command: string) => {
    const newCommands = [...value.startCommands];
    newCommands[index] = command;
    onChange({ ...value, startCommands: newCommands });
  };

  const handleStartCommandRemove = (index: number) => {
    onChange({
      ...value,
      startCommands: value.startCommands.filter((_, i) => i !== index),
    });
  };

  const handleTestCommandAdd = () => {
    onChange({
      ...value,
      testCommands: [...value.testCommands, ""],
    });
  };

  const handleTestCommandChange = (index: number, command: string) => {
    const newCommands = [...value.testCommands];
    newCommands[index] = command;
    onChange({ ...value, testCommands: newCommands });
  };

  const handleTestCommandRemove = (index: number) => {
    onChange({
      ...value,
      testCommands: value.testCommands.filter((_, i) => i !== index),
    });
  };

  const handleJsonChange = (jsonString: string | undefined) => {
    if (!jsonString) return;

    try {
      const parsed = JSON.parse(jsonString);
      setJsonError(null);
      onChange(parsed);
    } catch (error) {
      setJsonError(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Worker Definition
          </CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "form" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("form")}
              className={
                mode === "form"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              <FormInput className="w-4 h-4 mr-2" />
              Form Mode
            </Button>
            <Button
              type="button"
              variant={mode === "json" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("json")}
              className={
                mode === "json"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
              }
            >
              <Code2 className="w-4 h-4 mr-2" />
              JSON Mode
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {mode === "form" ? (
          <>
            {/* Dependencies */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Package className="w-4 h-4" />
                Dependencies
              </Label>
              <p className="text-sm text-slate-400">
                Search and select npm packages required for this assignment
              </p>
              <PackageSearchInput
                value={value.dependencies}
                onChange={handleDependenciesChange}
                placeholder="Search npm packages..."
              />
            </div>

            {/* Start Commands */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Start Commands
              </Label>
              <p className="text-sm text-slate-400">
                Commands to start the application (e.g., &quot;npm run
                dev&quot;)
              </p>
              <p className="text-sm text-slate-400">
                Note: Editing is disabled in this version.
              </p>
              <div className="space-y-2">
                {value.startCommands.map((command, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={command}
                      disabled={true}
                      onChange={(e) =>
                        handleStartCommandChange(index, e.target.value)
                      }
                      placeholder="npm run dev"
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={true}
                      size="icon"
                      onClick={() => handleStartCommandRemove(index)}
                      className="border-slate-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={true}
                  onClick={handleStartCommandAdd}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Start Command
                </Button>
              </div>
            </div>

            {/* Test Commands */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Test Commands
              </Label>
              <p className="text-sm text-slate-400">
                Commands to run tests (e.g., &quot;npm run test&quot;)
              </p>
              <p className="text-sm text-slate-400">
                Note: Editing is disabled in this version.
              </p>
              <div className="space-y-2">
                {value.testCommands.map((command, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={command}
                      disabled={true}
                      onChange={(e) =>
                        handleTestCommandChange(index, e.target.value)
                      }
                      placeholder="npm run test"
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={true}
                      size="icon"
                      onClick={() => handleTestCommandRemove(index)}
                      className="border-slate-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={true}
                  size="sm"
                  onClick={handleTestCommandAdd}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Command
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* JSON Editor */}
            <div className="space-y-2">
              <Label className="text-white">Worker Definition (JSON)</Label>
              <p className="text-sm text-slate-400">
                Edit the worker definition as JSON. Switch to Form Mode for a
                guided experience.
              </p>
              <Editor
                height={400}
                defaultLanguage="json"
                theme="vs-dark"
                value={JSON.stringify(value, null, 2)}
                onChange={handleJsonChange}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
              {jsonError && (
                <div className="text-red-500 text-sm mt-2">
                  Error: {jsonError}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
