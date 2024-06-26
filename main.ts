import * as yaml from "https://cdn.skypack.dev/yaml";
import { ApiFactory } from "./src/api.ts";
import { waitUntil } from "./src/utils.ts";
import { program, Option } from "npm:commander@12.0.0";
import esprima from "npm:esprima@4.0.1";
import cliProgress from "npm:cli-progress@3.4.0";
import colors from "npm:ansi-colors@4.1.1";
import {
  setup,
  handlers,
  getLogger,
} from "https://deno.land/std@0.158.0/log/mod.ts";

program
  .addOption(
    new Option("-p, --prod", "run eval in production")
      .conflicts("staging")
      .conflicts("local")
  )
  .addOption(
    new Option("-s, --staging", "run eval in staging")
      .conflicts("prod")
      .conflicts("local")
  )
  .addOption(
    new Option("-l, --local", "run eval in local")
      .conflicts("prod")
      .conflicts("staging")
  )
  .option("-A, --all", "test ALL questions")
  .argument(
    "[question]",
    `A list of numbers (e.g., "1,2,3") or a range of numbers (e.g., "1-3")`
  );
program.parse();
const options = program.opts();

if (!options.staging && !options.prod && !options.local) {
  console.error("Please specify an environment to run the eval");
  Deno.exit(1);
}

const bar = new cliProgress.SingleBar(
  {
    format:
      "Testing Progress |" +
      colors.cyan("{bar}") +
      "| {percentage}% [{value}/{total}] || passed: {passed} || failed: {failed}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
    stopOnComplete: true,
    gracefulExit: true,
  },
  cliProgress.Presets.rect
);

const api = ApiFactory(getEnvironment(options)!);
let curJob: any;
const reportDir = getTimestampedDirName("reporters");
Deno.mkdirSync(reportDir, { recursive: true });

const fileHandler = new handlers.FileHandler("INFO", {
  filename: `${reportDir}/testing.log`,
});

setup({
  handlers: {
    writeTofile: fileHandler,
  },
  loggers: {
    default: {
      level: "INFO",
      handlers: ["writeTofile"],
    },
  },
});

const logger = getLogger();
const flushIntervalId = setInterval(() => {
  fileHandler.flush();
}, 100);

Deno.addSignalListener("SIGINT", async () => {
  if (curJob) {
    logger.info(`pause: ${await api.cancelJob(curJob.id)}`);
    fileHandler.flush();
    Deno.exit();
  }
});

// TODO 支持通过参数切换 python 和 ts 测试
const questions = retrieveAllQuestions("questions").reduce((acc, cur) => {
  acc.set(cur.split(/-(.+)/)[0], cur);
  return acc;
}, new Map());
const targetQ = options.all
  ? Array.from(questions.keys())
  : parseQ(program.args[0]);
bar.start(targetQ.length, 0, {
  passed: "0",
  failed: "0",
});
const failedQ: string[] = [];
let passedQCount = 0;
for (const target of targetQ) {
  const q = questions.get(target);
  if (q) {
    const task = yaml.parse(await Deno.readTextFile(`questions/${q}` + "/task.yml"));
    const msg = await buildMsg(task);
    // explain: https://stackoverflow.com/a/38189405
    curJob = await invokeGru(q + Math.random().toString(36).substr(2, 4), msg);
    // 替换 waitUntil
    await waitUntil(
      async () => {
        if (curJob.status != "FINISHED") {
          curJob = await api.getJob(curJob.id);
          logger.info(curJob);
          return false;
        }
        return true;
      },
      {
        interval: 1000,
        timeout: 1000 * 60 * 5,
        timeoutWithError: false,
      }
    );

    // TODO 如果没有通过，自动在 gru-eval 项目创建 issue

    // gru 认为结果是否成功
    if (curJob.reason !== "SUCCESS") {
      await Deno.writeTextFile(
        `${reportDir}/${q}.yaml`,
        yaml.stringify({
          passedByGru: false,
          job: curJob,
          plan: await api.getPlan(curJob.id),
        })!
      );
      failedQ.push(q);
      bar.increment(1, { failed: failedQ.length });
    } else {
      // 实际是否成功
      const curPlan = await api.getPlan(curJob.id);
      const verify = await verifyGru(getNewestTsCode(curPlan), task.test.typescript)!
      await Deno.writeTextFile(
        `${reportDir}/${q}.yaml`,
        yaml.stringify({
          passedByGru: true,
          passedTruly: verify.res,
          verifyGruLog: verify.log,
          job: curJob,
          plan: await api.getPlan(curJob.id),
        })!
      );
      bar.increment(1, { passed: ++passedQCount });
    }
  } else {
    console.warn(`No.${target} question is nonexist!`);
  }
}

clearInterval(flushIntervalId);

function getNewestTsCode(plan: any) {
  return [...plan[0].tasks[0].steps].reverse().find((step: any) => step.name === "runTypescript").args.code;
}

async function verifyGru(code: string, test: string) {
  let functionName = "";
  esprima.tokenize(code).forEach((token: any) => {
    if (token.type === "Identifier" && functionName === "") {
      functionName = token.value;
    }
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(`
  import { expect } from "https://deno.land/x/expect/mod.ts";

  ${code}

  ${test}

  check(${functionName});
  `);
  const tempFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeFile(tempFile, data);

  // 运行临时文件
  const process = Deno.run({
    cmd: ["deno", "run", tempFile],
    stdout: "piped",
    stderr: "piped"
  })

  // 读取标准输出
const rawOutput = await process.output();
const output = new TextDecoder().decode(rawOutput);

// 读取标准错误输出
const rawError = await process.stderrOutput();
const error = new TextDecoder().decode(rawError);
  await Deno.remove(tempFile);
  return {res: (await process.status()).success, log: output + error};
}

function retrieveAllQuestions(dirPath: string): string[] {
  const fileNames: string[] = [];
  for (const dirEntry of Deno.readDirSync(dirPath)) {
    fileNames.push(dirEntry.name);
  }
  return fileNames;
}

function buildMsg(task: any) {

  return `
  I have the following TypeScript problem, please help me solve it and make sure that the test samples I give you later passes.
  \`\`\`typescript
  ${task.question.typescript}
  \`\`\`
  ## test samples
  \`\`\`yaml
  ${yaml.stringify(task.test.typescript)}
  \`\`\`
  `;
}

async function invokeGru(name: string, message: string) {
  const ns = await api.getNamespace();
  const babel = await api.createBabel(ns.id, name);

  return await api.createJob(ns.id, babel.id, name, JSON.stringify(message));
}

function getEnvironment(flags: any) {
  if (flags.prod) {
    return "prod";
  }
  if (flags.staging) {
    return "staging";
  }
  if (flags.local) {
    return "local";
  }
}

function parseQ(q: string) {
  // 检查是否是范围形式，例如 "1-3"
  const rangeMatch = q.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start > end) {
      throw new Error("Range start must be less than range end.");
    }
    return Array.from({ length: end - start + 1 }, (v, k) => k + start).map(
      (item) => item.toString().padStart(5, "0")
    );
  }

  // 检查是否是逗号分隔的数字列表，例如 "1,2,3"
  const listMatch = q.split(",").map(Number);
  if (listMatch.every((number) => !isNaN(number))) {
    return listMatch.map((item) => item.toString().padStart(5, "0"));
  }

  throw new Error(
    'Invalid format. Please provide a number range (e.g., "1-3") or a list of numbers (e.g., "1,2,3").'
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTimestampedDirName(baseDir: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-"); // ISO string with colons and periods replaced for file safety
  return `${baseDir}/${timestamp}`;
}
