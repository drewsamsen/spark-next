import { serve } from "inngest/next";
import { inngest, readwiseFetchBooksFn } from "@/../inngest.config";

const sendFn = inngest.createFunction(
  { name: "inngest/send", id: "inngest/send" },
  { event: "inngest/send" },
  async ({ event }) => {
    console.log("inngest/send", event);
  },
);

export const { POST, GET, PUT } = serve({
  client: inngest,
  functions: [sendFn, readwiseFetchBooksFn],
});
