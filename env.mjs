/* eslint-disable @typescript-eslint/naming-convention */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_WEBSOCKET_SERVER_URL: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_WEBSOCKET_SERVER_URL: process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION && !["0", "false"].includes(process.env.SKIP_ENV_VALIDATION),
});

export { env };
