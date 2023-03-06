import axios from "axios";
import { chunk } from "lodash";
import * as path from "path";
import * as fs from "fs";

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

interface AssDialog {
    attributes: string;
    dialogText: string;
}

const readAssFile = (filePath: string): [string, AssDialog[]] => {
    const content = fs.readFileSync(filePath).toString();
    if (!content.includes("[Events]")) {
        throw new Error("Invalid ASS: Events block not found.");
    }
    const [header, body] = content.split("[Events]");
    const lines = body
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => !!line);
    const dialogAttributesDefinition = lines[0];
    const dialogAttributesCount =
        dialogAttributesDefinition.split(",").length + 1;
    const result: AssDialog[] = [];
    for (const line of lines.slice(1)) {
        const splittedLine = line.split(",");
        const attributes = splittedLine
            .slice(0, dialogAttributesCount - 2)
            .join(",");
        const dialogText = splittedLine
            .slice(dialogAttributesCount - 2)
            .join(",");
        result.push({
            attributes,
            dialogText,
        });
    }
    return [`${header}\n[Events]\n`, result];
};

const translate = async (
    originDialogs: AssDialog[],
    apiKey
): Promise<AssDialog[]> => {
    const api = `https://api.openai.com/v1/chat/completions`;
    const prompt =
        "把以下字幕翻译成简体中文，在结果的相应位置保留原字幕的特效标签，只把内容翻译成简体中文。特效标签的特征是用一对大括号{}包裹。你的结果只包含翻译后的结果。以下是原始字幕：";
    const attributeArr = originDialogs.map((dialog) => dialog.attributes);
    const dialogTextArr = originDialogs.map((dialog) => dialog.dialogText);
    const response = await axios.post(
        api,
        {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `${prompt}${dialogTextArr.join("\n")}`,
                },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        }
    );
    const result = response.data?.choices?.[0]?.message?.content;
    if (!result) {
        throw new Error("Invalid response");
    }
    const resultLines = result
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => !!line);
    const translatedDialogs: AssDialog[] = [];
    for (let i = 0; i <= originDialogs.length - 1; i++) {
        if (!resultLines[i]) {
            continue;
        }
        translatedDialogs.push({
            attributes: attributeArr[i],
            dialogText: resultLines[i],
        });
    }
    console.log(translatedDialogs);
    return translatedDialogs;
};

export default class Translator {
    apiKey = "";

    result = [];

    constructor({ apiKey }: { apiKey: string }) {
        this.apiKey = apiKey;
    }

    translate = async (file: string) => {
        const [header, dialogs] = readAssFile(file);
        const chunks = chunk<AssDialog>(dialogs, 10);
        for (let i = 0; i <= chunks.length - 1; i++) {
            const translatedDialogs = await translate(chunks[i], this.apiKey);
            await sleep(3200); // API Rate limit
            this.result.push(
                ...translatedDialogs.map(
                    (dialog) => `${dialog.attributes},${dialog.dialogText}`
                )
            );
            console.log(`Finished ${i + 1} / ${chunks.length}`);
        }
    };
}
