import { ChatType } from "@prisma/client";
import { z } from "zod";

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(["text"]),
});

export const postRequestBodySchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    createdAt: z.coerce.date(),
    role: z.enum(["user"]),
    content: z.string().min(0).max(2000),
    parts: z.array(textPartSchema),
    // experimental_attachments: z
    //   .array(
    //     z.object({
    //       url: z.string().url(),
    //       name: z.string().min(1).max(2000),
    //       contentType: z.enum([
    //         "application/pdf",
    //         "text/plain",
    //         "image/jpeg",
    //         "image/png",
    //       ]),
    //     }),
    //   )
    //   .optional(),
  }),

  selectedChatModel: z.nativeEnum(ChatType),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
