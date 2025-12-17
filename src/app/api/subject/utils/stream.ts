import { after } from "next/server";
export type ResumableStreamContext = {
  waitUntil: typeof after;
  resumableStream: (streamId: string, streamFn: () => ReadableStream) => Promise<ReadableStream>;
};

function createResumableStreamContext(options: { waitUntil: typeof after }): ResumableStreamContext {
  return {
    waitUntil: options.waitUntil,
    resumableStream: async (streamId: string, streamFn: () => ReadableStream) => {
      return streamFn();
    },
  };
}


let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error) {
      console.error("error on redis stream", error);
    }
  }

  return globalStreamContext;
}
