import { getRequestConfig } from "next-intl/server";

import englishMessages from "../../messages/en.json";

export default getRequestConfig(async () => ({
  locale: "en",
  messages: englishMessages,
  timeZone: "Asia/Kolkata",
}));
