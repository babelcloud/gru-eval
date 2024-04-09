import { config } from "https://deno.land/x/dotenv/mod.ts";

config({ safe: true, export: true });

const endpoints: { [key: string]: string } = {
  prod: "https://babel.cloud/api",
  staging: "https://staging.babeltech.net/api",
  local: "http://localhost:2080/api",
};

const credentials = Deno.env.get("CREDENTIALS");

export function ApiFactory(env: string) {
  const endpoint = endpoints[env];
  return {
    getNamespace: async () => {
      return (
        await (
          await fetch(`${endpoint}/namespaces`, {
            headers: {
              Authorization: `Basic ${credentials}`,
            },
          })
        ).json()
      ).content[0];
    },
    createBabel: async (nsId: string, name: string) => {
      const babel = await (
        await fetch(`${endpoint}/namespaces/${nsId}/babels`, {
          headers: {
            Authorization: `Basic ${credentials}`,
            "x-babel-new-create": "true",
            "content-type": "application/json",
          },
          body: `{\"name\":\"${name}\",\"displayName\":\"${name}\",\"description\":\"\",\"icon\":\"/images/cards/workstation.png\"}`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        })
      ).json();

      await fetch(`${endpoint}/babels/${babel.id}/instances/main/component`, {
        headers: {
          "content-type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: `{"fileOperations":[{"content":"schemaVersion: v2-alpha4\\nid: ${nsId}\\nshortName: ${name}\\ndescription: \\"\\"\\n","new_path":"IGNORE","action":"create","path":"babel.yml"},{"content":"{}\\n","new_path":"IGNORE","action":"create","path":"config.yml"},{"content":"{}\\n","new_path":"IGNORE","action":"create","path":"dependencies.yml"},{"content":"[]\\n","new_path":"IGNORE","action":"create","path":"elements.yml"},{"content":"","new_path":"IGNORE","action":"create","path":"requirements.yml"}],"timerOperations":[],"vectorStoreCreations":[],"name":"${name}","description":""}`,
        method: "PATCH",
      });
      return babel;
    },
    createJob: async (
      nsId: string,
      babelId: string,
      name: string,
      content: string
    ) => {
      return await (
        await fetch(`${endpoint}/agent/jobs`, {
          headers: {
            "content-type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            title: name,
            target: "guru",
            source: "babel",
            options: { delayOnCached: 0, useCache: true },
            namespaceId: nsId,
            metadata: { skipArch: true },
            content: "",
            babelName: name,
            babelId: babelId,
            attachments: [{ name: "problem", content: content }],
          }),
          method: "POST",
          mode: "cors",
          credentials: "include",
        })
      ).json();
    },
    getJob: async (jobId: string) => {
      return await (
        await fetch(`${endpoint}/agent/jobs/${jobId}`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          method: "GET",
        })
      ).json();
    },
    getPlan: async (jobId: string) => {
      return await (
        await fetch(`${endpoint}/agent/plans?jobId=${jobId}`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          method: "GET",
        })
      ).json();
    },
    cancelJob: async (jobId: string) => {
      return await (
        await fetch(`${endpoint}/agent/jobs/${jobId}/cancel`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          method: "PATCH",
        })
      ).text();
    },
  };
}
