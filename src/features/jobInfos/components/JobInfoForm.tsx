"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { experienceLevels, JobInfoTable } from "@/drizzle/schema/jobInfo";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText } from "lucide-react";
import { jobInfoSchema } from "../schemas";
import { formatExperienceLevel } from "../lib/formatters";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { createJobInfo, updateJobInfo } from "../actions";
import { toast } from "sonner";
import { useState } from "react";

type JobInfoFormData = z.infer<typeof jobInfoSchema>;

// Predefined technology options
const AVAILABLE_TECHNOLOGIES = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "MongoDB",
  "Drizzle ORM",
  "Prisma",
  "TailwindCSS",
  "Docker",
  "AWS",
  "GraphQL",
  "REST API",
] as const;

export function JobInfoForm({
  jobInfo,
}: {
  jobInfo?: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "name" | "title" | "description" | "experienceLevel" | "technologies"
  >;
}) {
  const form = useForm<JobInfoFormData>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: jobInfo ?? {
      name: "",
      title: null,
      description: "",
      experienceLevel: "junior",
      technologies: [],
      hasResume: false,
    },
  });

  const [techInput, setTechInput] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [useResumeMode, setUseResumeMode] = useState(false);
  const selectedTechs = form.watch("technologies");

  // Adds a technology to the selected list
  const addTechnology = (tech: string) => {
    const currentTechs = form.getValues("technologies");
    if (!currentTechs.includes(tech)) {
      form.setValue("technologies", [...currentTechs, tech]);
    }
    setTechInput("");
  };

  // Removes a technology from the selected list
  const removeTechnology = (tech: string) => {
    const currentTechs = form.getValues("technologies");
    form.setValue(
      "technologies",
      currentTechs.filter((t) => t !== tech)
    );
  };

  // Handles resume file upload and parsing
  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setResumeFile(file);
    setIsParsingResume(true);
    setUseResumeMode(true);
    form.setValue("hasResume", true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to parse resume: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Extracts skills from the API response
      if (data.skills && Array.isArray(data.skills)) {
        form.setValue("technologies", data.skills);
        toast.success(
          `Found ${data.skills.length} technologies in your resume`
        );
      } else {
        toast.warning("No technologies found in resume");
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      toast.error("Failed to parse resume. Please try again.");
      setUseResumeMode(false);
      setResumeFile(null);
    } finally {
      setIsParsingResume(false);
    }
  };

  // Clears the resume and switches back to manual mode
  const clearResume = () => {
    setResumeFile(null);
    setUseResumeMode(false);
    form.setValue("technologies", []);
    form.setValue("hasResume", false);
  };

  async function onSubmit(values: JobInfoFormData) {
    const action = jobInfo
      ? updateJobInfo.bind(null, jobInfo.id)
      : createJobInfo;
    const res = await action(values);

    if (res.error) {
      toast.error(res.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This name is displayed in the UI for easy identification.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormDescription>
                  Optional. Only enter if there is a specific job title you are
                  applying for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {formatExperienceLevel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="technologies"
          render={() => (
            <FormItem>
              <FormLabel>Technologies</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Resume Upload Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="resume-upload"
                        className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${
                          useResumeMode || isParsingResume
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        } ${isParsingResume ? "opacity-50" : ""}`}
                      >
                        <Upload className="size-4" />
                        <span className="text-sm font-medium">
                          {isParsingResume
                            ? "Parsing Resume..."
                            : resumeFile
                            ? "Change Resume"
                            : "Upload Resume"}
                        </span>
                      </label>
                      <Input
                        id="resume-upload"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleResumeUpload}
                        disabled={isParsingResume}
                      />
                      {resumeFile && (
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="size-4" />
                            <span className="truncate max-w-xs">
                              {resumeFile.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearResume}
                            disabled={isParsingResume}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload your resume to automatically extract technologies,
                      or manually select below.
                    </p>
                  </div>

                  {/* Divider */}
                  {!useResumeMode && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or select manually
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Manual Selection */}
                  <Select
                    value={techInput}
                    onValueChange={(value) => {
                      addTechnology(value);
                    }}
                    disabled={useResumeMode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select technologies..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TECHNOLOGIES.filter(
                        (tech) => !selectedTechs.includes(tech)
                      ).map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Technologies */}
                  {selectedTechs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTechs.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="gap-1.5 pr-1"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="ml-0.5 rounded-sm hover:bg-secondary-foreground/20 transition-colors p-0.5"
                            aria-label={`Remove ${tech}`}
                            disabled={useResumeMode}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {useResumeMode
                  ? "Technologies extracted from your resume. Clear the resume to manually select."
                  : "Select the technologies relevant to this position."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description
                {!useResumeMode && (
                  <span className="text-destructive ml-1">*</span>
                )}
                {useResumeMode && (
                  <span className="text-muted-foreground text-sm font-normal ml-2">
                    (Optional)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    useResumeMode
                      ? "Add additional details about the role (optional since resume is uploaded)..."
                      : "A Next.js 15 and React 19 full stack web developer job that uses Drizzle ORM and Postgres for database management."
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {useResumeMode
                  ? "Optional. Add any additional context not covered in your resume."
                  : "Be as specific as possible. The more information you provide, the better the interviews will be."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Save Job Information
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
