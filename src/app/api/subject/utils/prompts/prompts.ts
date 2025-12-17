import { ChatType } from "@prisma/client";
import { CONTINUE_ANALYSIS_PROMPT, START_ANALYSIS_PROMPT } from "./analysis";
import { CONTINUE_BIAS_PROMPT, START_BIAS_PROMPT } from "./bias";
import { CONTINUE_LANDSCAPE_PROMPT, START_LANDSCAPE_PROMPT } from "./landscape";
import {
  CONTINUE_COUNTERPOINT_PROMPT,
  START_COUNTERPOINT_PROMPT,
} from "./counterpoint";
import { customPrompts } from "./custom";
import { CONTINUE_SUMMARY_PROMPT, START_SUMMARY_PROMPT } from "./summary";

export function getPromptByChatType(
  chatType: ChatType,
  isFirstMessage: boolean,
): string {
  switch (chatType) {
    case ChatType.ANALYSIS:
      if (isFirstMessage) {
        return START_ANALYSIS_PROMPT;
      } else {
        return CONTINUE_ANALYSIS_PROMPT;
      }
    case ChatType.COUNTERPOINT:
      if (isFirstMessage) {
        return START_COUNTERPOINT_PROMPT;
      } else {
        return CONTINUE_COUNTERPOINT_PROMPT;
      }
    case ChatType.BIAS:
      if (isFirstMessage) {
        return START_BIAS_PROMPT;
      } else {
        return CONTINUE_BIAS_PROMPT;
      }
    case ChatType.LANDSCAPE_ANALYSIS:
      if (isFirstMessage) {
        return START_LANDSCAPE_PROMPT;
      } else {
        return CONTINUE_LANDSCAPE_PROMPT;
      }
    case ChatType.SUMMARY:
      if (isFirstMessage) {
        return START_SUMMARY_PROMPT;
      } else {
        return CONTINUE_SUMMARY_PROMPT;
      }

    default:
      if (customPrompts.find((p) => p.chatType === chatType)) {
        if (!isFirstMessage) {
          return CONTINUE_ANALYSIS_PROMPT;
        }

        // const previousChats = await db.chat.findMany({
        //   where: { SubjectId: subjectId },
        //   orderBy: { createdAt: "asc" },
        //   include: {
        //     messages: true,
        //   },
        // });

        // // we need the analysis,

        return customPrompts.find((p) => p.chatType === chatType)?.prompt ?? "";
      }
      throw new Error(`Unknown chat type`);
  }
}
