#!/usr/bin/env node
import Erii from "erii";
import * as path from "path";
import * as fs from "fs";
import Translator from "./translator";

Erii.setMetaInfo({
    version: JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../package.json")).toString()
    )["version"],
    name: "AI ASS Translator",
});

Erii.bind(
    {
        name: ["help", "h"],
        description: "Show help documentation",
    },
    (ctx) => {
        ctx.showHelp();
    }
);

Erii.bind(
    {
        name: ["version"],
        description: "Show version",
    },
    (ctx) => {
        ctx.showVersion();
    }
);

Erii.bind(
    {
        name: ["translate", "t"],
        description: "Translate ASS file",
        argument: {
            name: "path",
            description: "Path to ASS file",
        },
    },
    async (ctx, options) => {
        const assFilePath = ctx.getArgument().toString();
        if (!assFilePath.endsWith(".ass")) {
            throw new Error("Only .ass files are supported.");
        }
        if (!fs.existsSync(assFilePath)) {
            throw new Error("File not exists");
        }
        if (!options.openaiApiKey) {
            throw new Error("No OpenAI API key provided.");
        }
        const translator = new Translator(options);
        await translator.translate(assFilePath);
        const outputPath = path.resolve(`${assFilePath}.translated.ass`);
        const header = fs
            .readFileSync(assFilePath)
            .toString()
            .split("Dialogue:")[0];
        fs.writeFileSync(
            outputPath,
            `${header}${translator.result.join("\n")}`
        );
        console.log(`All done, check your file at [${outputPath}]`);
    }
);

Erii.addOption({
    name: ["openai-api-key"],
    command: "translate",
    description: "OpenAI API Key",
    argument: {
        name: "key",
        description: "",
    },
});

Erii.addOption({
    name: ["batch-size"],
    command: "translate",
    description: "Batch size of subtitle lines per request. Defaults to 10.",
    argument: {
        name: "size",
        description: "",
    },
});

Erii.addOption({
    name: ["disable-rate-limit"],
    command: "translate",
    description: "Disable rate limit for OpenAI API",
});

Erii.default(() => {
    Erii.showHelp();
});

Erii.okite();
