import { expect, test } from "@playwright/test";

test("visible arrival times advance as the mocked tracker progresses", async ({
  page,
}) => {
  await page.goto("/?mockStage=0");

  await expect(page.getByTestId("checkpoint-actual-1-skiddaw")).toHaveText(
    "Waiting for tracker",
  );
  await expect(page.getByText("82%")).toBeVisible();

  await page.goto("/?mockStage=1");

  await expect(page.getByTestId("checkpoint-actual-1-skiddaw")).toHaveText(
    "Fri 20:20",
  );
  await expect(page.getByTestId("checkpoint-status-1-skiddaw")).toHaveText(
    "Reached",
  );
  await expect(page.getByText("74%")).toBeVisible();

  await page.goto("/?mockStage=2");

  await expect(
    page.getByTestId("checkpoint-actual-1-great-calva"),
  ).toHaveText("Fri 21:02");
  await expect(
    page.getByTestId("checkpoint-status-1-great-calva"),
  ).toHaveText("Reached");
  await expect(page.getByText("52%")).toBeVisible();
  await expect(page.getByText("Blencathra").first()).toBeVisible();
});