import { googleSpeechToText } from "../src";
import * as fs from "fs";
import path from "path";
import { TranscriberPlugin, TranscriptEvent } from "ivr-tester";

jest.setTimeout(20 * 1000);
describe("Google Speech-to-Text", () => {
  const audioFilePath = path.join(__dirname, "test-data/mulaw-01.wav");
  let transcriber: TranscriberPlugin;

  beforeEach(() => {
    transcriber = googleSpeechToText()();
  });

  afterEach(() => transcriber.close());

  test("Transcribe mulaw audio", async () => {
    const audioFile = fs.readFileSync(audioFilePath);
    transcriber.transcribe(audioFile);

    const { transcription }: TranscriptEvent = await new Promise((resolve) =>
      transcriber.on("transcription", resolve)
    );
    expect(transcription).toContain("this will allow you");
  });
});
