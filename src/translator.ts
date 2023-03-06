import axios from "axios";
import { chunk } from "lodash";
import * as path from "path";
import * as fs from "fs";

const getAssDialogLines = (file_path: string) => {
    const content = fs.readFileSync(file_path).toString();
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => !!line);
    const result = [];
    for (const line of lines) {
        if (line.startsWith("Dialogue:")) {
            result.push(line);
        }
    }
    return result;
};

const translate = async (originLines: string[], apiKey) => {
    const api = `https://api.openai.com/v1/chat/completions`;
    const prompt =
        "把以下字幕翻译成简体中文，保留字幕的开始、结束时间、样式标签等信息，只翻译内容。你的结果只包含翻译成简体中文后的结果。以下是原始字幕：";
    const response = await axios.post(
        api,
        {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: `${prompt}${originLines.join("\n")}` },
            ],
            temperature: 0.3,
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        }
    );
    return response.data?.choices?.[0]?.message?.content || "";
};

export default class Translator {
    apiKey = "";

    result = [];

    constructor({ apiKey }: { apiKey: string }) {
        this.apiKey = apiKey;
    }

    translate = async (file: string) => {
        const lines = getAssDialogLines(file);
        const chunks = chunk<string>(lines, 10);
        for (let i = 0; i <= chunks.length - 1; i++) {
            const chunkTranslateResult = await translate(
                chunks[i],
                this.apiKey
            );
            this.result.push(...chunkTranslateResult.split("\n"));
            console.log(`Finished ${i + 1} / ${chunks.length}`);
        }
    };
}
