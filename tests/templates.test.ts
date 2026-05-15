import { describe, expect, it } from "vitest";

import { defaultTemplates } from "@/features/templates/default-templates";

describe("default templates", () => {
  it("ships 40 gendered realistic portrait templates", () => {
    expect(defaultTemplates).toHaveLength(40);
    expect(
      defaultTemplates.filter((template) =>
        template.genderOptions.includes("male"),
      ),
    ).toHaveLength(20);
    expect(
      defaultTemplates.filter((template) =>
        template.genderOptions.includes("female"),
      ),
    ).toHaveLength(20);

    for (const template of defaultTemplates) {
      expect(template.prompt).toContain("Identity has the highest priority");
      expect(template.prompt).toContain(
        "Preserve the recognizable facial identity",
      );
      expect(template.prompt).toContain("same real person in every template");
      expect(template.prompt).toContain("generic prettier person");
      expect(template.prompt).toContain("Template styling is important");
      expect(template.prompt).toContain("one continuous real photograph");
      expect(template.prompt).toContain("head-to-body proportion natural");
      expect(template.prompt).toContain("balanced natural exposure");
      expect(template.prompt).toContain("natural skin undertone");
      expect(template.prompt).toContain("unnatural color cast");
      expect(template.prompt).toContain("skin tone and facial features");
      expect(template.negativePrompt).toContain("pasted head");
      expect(template.negativePrompt).toContain("mismatched neck");
      expect(template.negativePrompt).toContain("wrong head size");
      expect(template.negativePrompt).toContain("overexposed");
      expect(template.negativePrompt).toContain("underexposed");
      expect(template.negativePrompt).toContain("blown highlights");
      expect(template.negativePrompt).toContain("washed out skin");
      expect(template.negativePrompt).toContain("unnatural color cast");
      expect(template.negativePrompt).toContain("futuristic mech");
      expect(template.negativePrompt).toContain("CGI");
    }
  });
});
