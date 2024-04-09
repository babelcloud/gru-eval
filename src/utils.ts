import { setInterval } from "https://deno.land/std@0.170.0/node/timers/promises.ts";

export type WaitUntilCallback = () => boolean | Promise<boolean>;

export type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T;

export interface WaitUntilOptions {
    /**
     * @description Time in ms between each check callback
     * @default 50ms
     */
    interval?: number;
    /**
     * @description Time in ms after which the throw a timeout error
     * @default 1000ms
     */
    timeout?: number;

    /**
     * @description If true, throw a timeout error when the timeout is reached, default is true
     */
    timeoutWithError?: boolean;
}

export const waitUntil = async <T>(
    callback: WaitUntilCallback,
    options: number | WaitUntilOptions = {}
): Promise<Truthy<T>> => {
    const {
        interval = 50,
        timeout = 1000,
        timeoutWithError = true,
    } = typeof options === "number" ? { timeout: options } : options;

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        // 递归函数，用于处理重复执行callback
        const attempt = async () => {
            // 如果超时，根据timeoutWithError参数决定是抛出错误还是返回"timeout"
            if (Date.now() - startTime > timeout) {
                if (timeoutWithError) {
                    reject(new Error("waitUntil timeout error"));
                } else {
                    resolve("timeout" as Truthy<T>);
                }
                return;
            }

            // 尝试执行callback
            try {
                if (await callback()) {
                    resolve("done" as Truthy<T>);
                } else {
                    // 如果callback返回false，继续等待
                    setTimeout(attempt, interval);
                }
            } catch (error) {
                reject(new Error(`waitUntil callback error: ${error}`));
            }
        };

        // 开始第一次尝试
        setTimeout(attempt, 0);
    });
};