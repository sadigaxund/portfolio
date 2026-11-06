import { expect, test } from "@playwright/test";

test("the kit page stays out of a production build", async ({ request }) => {
  const response = await request.get("/kit");
  expect(response.status()).toBe(404);
});
