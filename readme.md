# ai-ass-translator

## Installation

`npm i -g ai-ass-translator`

## Usage

`aat -t example.ass --openai-api-key <your_api_key_here>`

```
AI ASS Translator / 1.2.0

Help:
     Commands                      Description                   Alias

     --help                        Show help documentation       -h
     --version                     Show version
     --translate <path>            Translate ASS file            -t
         <path>                    Path to ASS file
         --openai-api-key <key>    OpenAI API Key
             <key>
         --batch-size <size>       Batch size of subtitle lines per request. Defaults to 10.
             <size>
         --disable-rate-limit      Disable rate limit for OpenAI API

```
