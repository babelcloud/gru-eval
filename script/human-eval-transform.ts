import { readLines } from "https://deno.land/std/io/mod.ts";
import OpenAI from "https://deno.land/x/openai@v4.33.0/mod.ts";

import { parse, stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";

function getTask(prompt: string) {
  const tripleQuoteContentRegex = /\"\"\"(.*?)\"\"\"/s;
  const match = prompt.match(tripleQuoteContentRegex);

  if (match) {
    // 获取三引号包裹的内容
    const tripleQuoteContent = match[1].trim();

    // 分离任务描述和示例
    const taskAndExamples = tripleQuoteContent.split(">>> ");
    const taskDescription = taskAndExamples.shift().trim(); // 第一个元素是任务描述
    const examples = taskAndExamples.map((exampleLine) => {
      // 分割每个示例为 input 和 output
      let [input, output] = exampleLine.split("\n").map((s) => s.trim());
      if (output === undefined) {
        [input, output] = exampleLine.split("==").map((s) => s.trim());
      }
      return { usageExample: input, output };
    });

    // 输出结果
    return {
      target: taskDescription,
      examples,
    };
  } else {
    console.log("No triple-quoted content found");
  }
}

function getTest(test: string) {
  const testRegex = /assert candidate\((.+?)\) == (.+)$/gm;
  let match;
  const tests = [];

  while ((match = testRegex.exec(test)) !== null) {
    // 提取输入和输出
    const input = match[1];
    const output = match[2];

    // 将提取的输入和输出添加到测试数组中
    tests.push({ input, output });
  }
  // if (tests.length === 0) console.log(test)
  return tests;
}

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
const jsonlFilePath = "./HumanEval-0407.jsonl";
const originData = await readJsonlFile(jsonlFilePath);

const dataset = originData.map(async (item) => {
  const tests = getTest(item.test);

  const completion = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content:
          `I want to send a code snippet with comments. 
          Please return a file name of the comments in three or fewer English words, connected by hyphens.
          ** only return the name`,
      },
      { role: "user", content: item.prompt },
    ],
    model: "gpt-3.5-turbo",
  });

  console.log(item.task_id.match(/(\d+)/)[0].padStart(5, "0"))
  
  return {
    taskId:
      item.task_id.match(/(\d+)/)[0].padStart(5, "0") +
      "-" +
      completion.choices[0].message.content,
    ...getTask(item.prompt),
    tests,
    difficulty: "unclassified",
    origin: item,
  };
});
const temp = dataset.map(async (Pitem) => {
  const item = await Pitem;
  await Deno.mkdir(`questions/${item.taskId}`);

  // 将 YAML 内容写入文件
  await Deno.writeTextFile(
    `questions/${item.taskId}/code.py`,
    item.origin.prompt
  );

  delete item.origin;

  const yamlContent = stringify(item);

  // 将 YAML 内容写入文件
  await Deno.writeTextFile(`questions/${item.taskId}/task.yml`, yamlContent);
});

Promise.all(temp);

