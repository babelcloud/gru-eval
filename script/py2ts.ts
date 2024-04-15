import { stringify } from "https://cdn.skypack.dev/yaml";
import { parse } from "https://deno.land/std@0.207.0/yaml/parse.ts";
import OpenAI from "https://deno.land/x/openai@v4.33.0/mod.ts";

const dirPath = "questions";
const client = new OpenAI({
  apiKey: "",
});

if (Deno.args) {
  console.log("single:" + Deno.args[0]);
  await process(`${dirPath}/${Deno.args[0]}`);
  Deno.exit(0);
}

for await (const dirEntry of Deno.readDir(dirPath)) {
  // 构建完整的文件路径
  const filePath = `${dirPath}/${dirEntry.name}`;
  if (dirEntry.isDirectory) {
    process(filePath);
  }
}

async function process(filePath: string) {
  const task: any = parse(await Deno.readTextFile(filePath + "/task.yml"));
  const code = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `I want to convert python function signature to ts code.
          ## constraint
          * only return code
          * Leave the comments in the python code
          * start with \`>>>\` is example, need reserve
          
          ${task.question.python}
          `,
      },
    ],
    model: "gpt-4-1106-preview",
  });
  task.question.typescript = code.choices[0].message
    .content!.replaceAll("```", "")
    .replace("typescript", "");

  const test = await client.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `I want to convert python function to ts function, this function recieve a function object 
            ## constraint
            * only return code
            
            ## example
            function check(candidate) {
              expect(candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.95)).toBe(true);
              expect(candidate([1.1, 2.2, 3.1, 4.1, 5.1], 1.0).toBe(true);
            }
            
            ${task.test.python}
            `,
      },
    ],
    model: "gpt-4-1106-preview",
  });
  console.log(filePath);
  task.test.typescript = test.choices[0].message
    .content!.replaceAll("```", "")
    .replace("typescript", "");
  await Deno.writeTextFile(`${filePath}/task.yml`, stringify(task)!);
}
