import { readLines } from "https://deno.land/std/io/mod.ts";
import OpenAI from "https://deno.land/x/openai@v4.33.0/mod.ts";

import { parse, stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";

// 使用正则表达式匹配三引号之间的内容

const client = new OpenAI({
  apiKey: "",
});

// 定义一个异步函数来处理读取和解析 JSONL 文件
async function readJsonlFile(filePath) {
  // 打开文件
  const file = await Deno.open(filePath);
  const jsonObjects = [];

  // 使用 `readLines` 函数逐行读取文件
  for await (const line of readLines(file)) {
    try {
      // 解析每一行为 JSON 对象
      const jsonObject = JSON.parse(line);
      jsonObjects.push(jsonObject);
    } catch (error) {
      console.error("Error parsing JSON line: ", error);
    }
  }

  // 关闭文件
  file.close();

  // 返回解析后的 JSON 对象数组
  return jsonObjects;
}

// 使用定义好的函数读取 `.jsonl` 文件
const jsonlFilePath = "dataset/HumanEval-0407.jsonl";
const originData = await readJsonlFile(jsonlFilePath);

const dataset = originData.map(async (item) => {
  const completion = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `I want to send a code snippet with comments. 
          Please return a file name of the comments in three or fewer English words, connected by hyphens.
          ** only return the name`,
      },
      { role: "user", content: item.prompt },
    ],
    model: "gpt-4-1106-preview",
  });

  console.log(item.task_id.match(/(\d+)/)[0].padStart(5, "0"));

  return {
    id:
      item.task_id.match(/(\d+)/)[0].padStart(5, "0") +
      "-" +
      completion.choices[0].message.content,
    question: {
      typescript: "",
      python: item.prompt,
    },
    test: {
      typescript: "",
      python: item.test,
    },
    difficulty: "unclassified",
    origin: item,
  };
});
const temp = dataset.map(async (Pitem) => {
  const item = await Pitem;
  await Deno.mkdir(`questions/${item.id}`);

  delete item.origin;

  const yamlContent = stringify(item);

  // 将 YAML 内容写入文件
  console.log(`${item.id}`);
  await Deno.writeTextFile(`questions/${item.id}/task.yml`, yamlContent);
});

Promise.all(temp);
