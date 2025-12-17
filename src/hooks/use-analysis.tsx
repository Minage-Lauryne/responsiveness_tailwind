"use client";

import { useCallback, useRef, useState } from "react";

interface UploadUrlResponse {
  submission_id: string;
  rfp_upload?: {
    filename: string;
    upload_url: string | null;
    file_path: string;
    token: string;
  };
  proposal_uploads: Array<{
    filename: string;
    upload_url: string | null;
    file_path: string;
    token: string;
  }>;
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const inFlightRef = useRef<boolean>(false);

  const uploadFiles = useCallback(async (formData: FormData) => {
    if (inFlightRef.current) {
      throw new Error("Request already in progress");
    }
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setProgress("Preparing upload...");
    setSubmissionId(null);

    try {
      // Extract files and context from FormData
      const rfpFile = formData.get("rfp") as File | null;
      const proposalFiles: File[] = [];
      const proposals = formData.getAll("proposals");
      proposals.forEach((p) => {
        if (p instanceof File) {
          proposalFiles.push(p);
        }
      });

      let contextText = "";
      if (formData.has("context")) {
        const ctx = formData.get("context");
        if (ctx) {
          if (typeof ctx === "string") {
            contextText = ctx.trim();
          } else if (ctx instanceof Blob) {
            try {
              contextText = (await ctx.text()).trim();
            } catch (error) {
              console.warn("[useAnalyze] Failed to convert context blob to text", error);
            }
          }
        }
      }

      // Helper to sanitize filenames by replacing problematic characters
      const sanitizeFilename = (filename: string): string => {
        // Replace em dash (—), en dash (–), and other special chars with hyphen
        return filename
          .replace(/[—–]/g, '-')  // Replace em/en dashes
          .replace(/[""]/g, '"')   // Replace smart quotes
          .replace(/['']/g, "'")   // Replace smart apostrophes
          .replace(/[^\w\s.-]/g, '_'); // Replace other special chars with underscore
      };

      // STEP 1: Generate upload URLs from backend
      setProgress("Generating upload URLs...");
      const generateUrlsPayload: {
        rfp_filename?: string;
        proposal_filenames: string[];
      } = {
        proposal_filenames: proposalFiles.map((file) => sanitizeFilename(file.name)),
      };

      if (rfpFile) {
        generateUrlsPayload.rfp_filename = sanitizeFilename(rfpFile.name);
      }

      const generateUrlsResponse = await fetch("/api/storage/generate-upload-urls/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generateUrlsPayload),
        credentials: "include",
      });

      if (!generateUrlsResponse.ok) {
        const errorText = await generateUrlsResponse.text();
        throw new Error(errorText || `Failed to generate upload URLs: ${generateUrlsResponse.status}`);
      }

      const uploadUrlsData = await generateUrlsResponse.json() as UploadUrlResponse;

    
      const cleanUploadUrl = (url: string): string => {
        return url.replace(/([^:]\/)\/+/g, '$1');
      };

      // STEP 2: Upload files directly to Supabase using the upload_url from backend
      setProgress(`Uploading ${proposalFiles.length} file(s) to storage...`);
      const uploadedPaths: { rfp_path?: string; proposal_paths: string[] } = {
        proposal_paths: [],
      };

      // Upload RFP if present
      if (rfpFile && uploadUrlsData.rfp_upload) {
        const rfpUpload = uploadUrlsData.rfp_upload;
        
        if (!rfpUpload.upload_url) {
          throw new Error("RFP upload_url is missing from backend response");
        }
        
        const cleanedUploadUrl = cleanUploadUrl(rfpUpload.upload_url);
        console.log('[Step 2] Uploading RFP to:', cleanedUploadUrl);
        
        const uploadResponse = await fetch(cleanedUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": rfpFile.type || "application/pdf",
          },
          body: rfpFile,
        });

        console.log('[Step 2] RFP upload response:', uploadResponse.status, uploadResponse.statusText);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();

          throw new Error(`Failed to upload RFP file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }

        uploadedPaths.rfp_path = rfpUpload.file_path;
      }

      // Upload proposals
      for (let i = 0; i < proposalFiles.length; i++) {
        const proposalFile = proposalFiles[i];
        const proposalUpload = uploadUrlsData.proposal_uploads[i];
        
        if (!proposalFile || !proposalUpload) continue;

        if (!proposalUpload.upload_url) {
          throw new Error(`Proposal ${i + 1} upload_url is missing from backend response`);
        }

        const cleanedUploadUrl = cleanUploadUrl(proposalUpload.upload_url);


        const uploadResponse = await fetch(cleanedUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": proposalFile.type || "application/pdf",
          },
          body: proposalFile,
        });


        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`[Step 2] Proposal ${i + 1} upload error:`, errorText);
          throw new Error(`Failed to upload proposal ${proposalFile.name}: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }

        uploadedPaths.proposal_paths.push(proposalUpload.file_path);
      }

      // STEP 3: Trigger analysis with uploaded file paths
      setProgress("Files uploaded successfully! Starting analysis...");
      const createAnalysisPayload: {
        rfp_path?: string;
        proposal_paths: string[];
        instructions?: string;
      } = {
        proposal_paths: uploadedPaths.proposal_paths,
      };

      if (uploadedPaths.rfp_path) {
        createAnalysisPayload.rfp_path = uploadedPaths.rfp_path;
      }


      if (contextText) {
        createAnalysisPayload.instructions = contextText;
      }

      const createAnalysisResponse = await fetch("/api/storage/create-from-urls/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createAnalysisPayload),
        credentials: "include",
      });

      if (!createAnalysisResponse.ok && createAnalysisResponse.status !== 202) {
        let errorText = await createAnalysisResponse.text();
        try {
          const errorJson = JSON.parse(errorText) as { error?: string };
          errorText = errorJson.error || errorText;
        } catch (err) {
          setError((err as Error).message);
        }
        if (createAnalysisResponse.status === 401) {
          throw new Error("Authentication failed: " + (errorText || "Please log in again."));
        }
        throw new Error(errorText || `HTTP ${createAnalysisResponse.status}`);
      }

      const responseData = await createAnalysisResponse.json() as { id: string; task_id?: string };

      // STEP 4: Poll for completion every 20 seconds
      const submissionId = responseData.id;
      setSubmissionId(submissionId);
      setProgress("Analysis in progress... this may take 5-15 minutes");
      
      const maxAttempts = 45; // 15 minutes with 20-second intervals
      const pollInterval = 20000; // 20 seconds
      let attempts = 0;


      const pollSubmission = async (): Promise<unknown> => {
        while (attempts < maxAttempts) {
          attempts++;
          
          const elapsedMinutes = Math.floor((attempts * pollInterval) / 60000);
          const elapsedSeconds = Math.floor((attempts * pollInterval) / 1000) % 60;
          setProgress(`Analyzing... ${elapsedMinutes}m ${elapsedSeconds}s elapsed`);


          try {
            const statusResponse = await fetch(`/api/submissions/${submissionId}`, {
              credentials: "include",
            });

            if (!statusResponse.ok) {
              console.error(`[Step 4] Poll failed with status ${statusResponse.status}`);
              

              if (statusResponse.status === 404) {

                const analyzeResponse = await fetch(`/api/analyze?id=${submissionId}`, {
                  credentials: "include",
                });
                
                console.log(`[Step 4] /api/analyze response: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
                
                if (analyzeResponse.ok) {
                  const submission = await analyzeResponse.json() as { title?: string; rfp_title?: string; rfp_id?: string };
                  console.log(`[Step 4] Submission data from /api/analyze:`, submission);
                  console.log(`[Step 4] rfp_title: "${submission?.rfp_title}"`);
              
                  const isComplete = submission?.rfp_title && submission.rfp_title !== "Analysis in progress...";
                  
                  if (isComplete) {
                    setProgress("Analysis complete!");
                    

                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("analysis:updated"));
                    }
                    
                    return submission;
                  } else {
                    console.log(`[Step 4] Still in progress (rfp_title: "${submission?.rfp_title}"), will continue polling...`);
                  }
                } else {
                   await analyzeResponse.text();
            
                }
              }
              
           
              if (statusResponse.status === 401) {
                throw new Error("Authentication expired during analysis");
              }
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              continue;
            }

            const submission = await statusResponse.json() as { title?: string };
            
        
            if (submission.title && submission.title !== "Analysis in progress...") {
              console.log('[Step 4] Analysis complete!');
              return submission;
            }

   
          } catch (error) {
            console.error('[Step 4] Poll error:', error);
            // Continue polling unless max attempts reached
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error("Analysis timeout: The analysis is taking longer than expected. Please check back later.");
      };

      const json = await pollSubmission();
      
      // Analysis complete - trigger event so sidebar can refresh

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("analysis:updated"));
      }
      
      // Return the result
      return json;
    } catch (error) {
      setError((error as Error).message);
      throw error;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setProgress(null);
    }
  }, []);

  return { loading, error, progress, submissionId, uploadFiles };
}