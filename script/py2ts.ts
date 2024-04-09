import OpenAI from "https://deno.land/x/openai@v4.33.0/mod.ts";

const dirPath = "questions";
const client = new OpenAI({
  apiKey: "",
});
for await (const dirEntry of Deno.readDir(dirPath)) {
  // 构建完整的文件路径
  const filePath = `${dirPath}/${dirEntry.name}`;
//   try {
//     await Deno.remove(`${filePath}/code.ts`);
//   } catch (_e) {}
  if (dirEntry.isDirectory) {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `I want to convert python function signature to ts code.
          ## constraint
          * only return code
          * Leave the content in the comments
          
          ${await Deno.readTextFile(filePath + "/code.py")}
          `,
        },
      ],
      model: "gpt-4-1106-preview",
    });
    console.log(filePath);
    // await Deno.writeTextFile(
    //   `${filePath}/code.ts`,
    //   completion.choices[0].message
    //     .content!.replaceAll("```", "")
    //     .replace("typescript", "")
    // );
  }
}
