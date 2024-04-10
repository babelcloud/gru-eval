# gru-eval

## 介绍
```shell
.____main.ts              // 入口函数
|____dataset              // 原始数据集
| |____dataset.yaml
| |____HumanEval-0407.jsonl
|____deno.json
|____script               // 数据集处理脚本
| |____human-eval-transform.ts
| |____py2ts.ts
|____README.md
|____deno.lock
|____.gitignore
|____.env
|____questions            // 问题所在目录
| |____00000-xxx
| | |____code.py          // 问题 python 代码（有的问题可以没有）
| | |____code.ts          // 问题 typescript 代码（有的问题可以没有）
| | |____task.yml         // 问题元信息
| | |____result.yml       // 历史测试结果
| |____...
|____src
| |____api.ts
```
## 如何运行
```shell
deno task gru-eval -h  
Task gru-eval deno run --allow-all ./main.ts "-h"
Usage: main [options] [question]

Arguments:
  question       A list of numbers (e.g., "1,2,3") or a range of numbers (e.g., "1-3")

Options:
  -p, --prod     run eval in production
  -s, --staging  run eval in staging
  -l, --local    run eval in local
  -A, --all      test ALL questions
  -h, --help     display help for command
```


> 环境变量中需要有 `CREDENTIALS`，存储 babel 账号的 basic 认证 token，like `CREDENTIALS=YmFiZWw6xxxxx`

// TODO: 支持用户 cookie 直接测试


## 题目列表 && 测试结果
TODO

## 未完成任务
- 用 Listr 提供更细节的运行信息
- 每个时间戳生成的所有 result 生成 report
- CI 支持定时/手动跑测试
- 有了 report 之后，自动绘图展示通过率变化
- py2ts 支持单独的问题编号转换
- 题目校对