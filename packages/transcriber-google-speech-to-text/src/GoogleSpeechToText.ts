import { EventEmitter } from "events";
import { protos, SpeechClient } from "@google-cloud/speech";
import { TranscriberPlugin, TranscriptEvent } from "ivr-tester";
import { Transcript } from "./Transcript";
import internal from "stream";

export class GoogleSpeechToText
  extends EventEmitter
  implements TranscriberPlugin {
  private static createConfig(
    speechPhrases: string[],
    useEnhanced: boolean
  ): Readonly<protos.google.cloud.speech.v1.IStreamingRecognitionConfig> {
    return {
      config: {
        encoding:
          protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.MULAW,
        sampleRateHertz: 8000,
        languageCode: "en-GB", // TODO Allow to be customised
        model: "phone_call",
        speechContexts: [{ phrases: speechPhrases }],
        useEnhanced,
      },
      interimResults: true,
      singleUtterance: false,
    };
  }

  private readonly config: Readonly<
    protos.google.cloud.speech.v1.IStreamingRecognitionConfig
  >;
  private stream: internal.Writable;
  private streamCreatedAt: Date;

  constructor(
    private speechPhrases: string[] = [],
    private useEnhanced = true,
    private readonly speechClient = new SpeechClient()
  ) {
    super();
    this.config = GoogleSpeechToText.createConfig(speechPhrases, useEnhanced);
  }

  public transcribe(payload: Buffer) {
    this.getStream().write(payload.toString("base64"));
  }

  public close() {
    if (this.stream) {
      this.stream.destroy();
    }
  }

  private newStreamRequired() {
    if (!this.stream) {
      return true;
    } else {
      const now = new Date();
      const timeSinceStreamCreated =
        now.valueOf() - this.streamCreatedAt.valueOf();
      return timeSinceStreamCreated / 1000 > 60;
    }
  }

  public getStream() {
    if (this.newStreamRequired()) {
      if (this.stream) {
        this.stream.destroy();
      }

      this.streamCreatedAt = new Date();
      this.stream = this.speechClient
        .streamingRecognize(this.config)
        .on("error", console.error)
        .on("data", (data: { results: Transcript[] }) => {
          const result = data.results[0];
          if (result?.alternatives[0] !== undefined) {
            const event: TranscriptEvent = {
              transcription: result.alternatives[0].transcript.trim(),
              isFinal: result.isFinal,
            };
            this.emit("transcription", event);
          }
        });
    }

    return this.stream;
  }
}
