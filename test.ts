
const encoder = new TextEncoder();
  const data = encoder.encode(`
  
import { expect } from "https://deno.land/x/expect/mod.ts";

function hasCloseElements(numbers: number[], threshold: number): boolean {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (Math.abs(numbers[i] - numbers[j]) < threshold) {
        return true;
      }
    }
  }
  return false;
}


function check(
  candidate: (numbers: number[], threshold: number) => boolean
): void {
  expect(candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.3)).toBe(true);
  expect(candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.05)).toBe(false);
  expect(candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.95)).toBe(true);
  expect(candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.8)).toBe(false);
  expect(candidate([1.0, 2.0, 3.0, 4.0, 5.0, 2.0], 0.1)).toBe(true);
  expect(candidate([1.1, 2.2, 3.1, 4.1, 5.1], 1.0)).toBe(true);
  expect(candidate([1.1, 2.2, 3.1, 4.1, 5.1], 0.5)).toBe(false);
}

check(hasCloseElements);`);
  const tempFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeFile(tempFile, data);

  // 运行临时文件
  console.log(await Deno.run({
    cmd: ["deno", "run", tempFile],
  }).status());
  
  await Deno.remove(tempFile);