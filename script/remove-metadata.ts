import yaml from "https://cdn.skypack.dev/yaml";
import { parse } from "https://deno.land/std@0.207.0/yaml/parse.ts";

const dirPath = "questions";
for await (const dirEntry of Deno.readDir(dirPath)) {
  // 构建完整的文件路径
  const filePath = `${dirPath}/${dirEntry.name}`;
  if (dirEntry.isDirectory) {
    console.log(filePath);

    const task: any = parse(await Deno.readTextFile(filePath + "/task.yml"));
    // 正则表达式用于匹配METADATA块及其内容
    const metadataRegex = /METADATA\s*=\s*\{[\s\S]*?\}\s*\n*/g;
    // 使用字符串的replace方法移除匹配的部分
    task.test.python = task.test.python.replace(metadataRegex, "");
    await Deno.writeTextFile(`${filePath}/task.yml`, yaml.stringify(task)!);
  }
}
