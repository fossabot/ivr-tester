import { SpeechClient } from "@google-cloud/speech";
import { TranscriberFactory } from "ivr-tester";
import { GoogleSpeechToText } from "./GoogleSpeechToText";

export const googleSpeechToText = (
  speechPhrases: string[] = [],
  useEnhanced = false,
  speechClient = new SpeechClient()
): TranscriberFactory => () =>
  new GoogleSpeechToText(speechPhrases, useEnhanced, speechClient);
