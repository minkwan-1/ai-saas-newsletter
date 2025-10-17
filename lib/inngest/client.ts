import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "personalized-newsletter",
  name: "Personalized Newsletter Generator",
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
