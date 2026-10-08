import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { normalizeUploadImage } from "@/app/api/uploads/route";

describe("upload image validation", () => {
  it("rejects a file that only claims to be a JPEG", async () => {
    const file = new File(["not-an-image"], "fake.jpg", {
      type: "image/jpeg",
    });

    await expect(normalizeUploadImage(file)).rejects.toThrow(
      "图片内容与文件格式不一致",
    );
  });

  it("re-encodes a valid JPEG and never preserves a script extension", async () => {
    const jpeg = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: "white",
      },
    }).jpeg().toBuffer();
    const file = new File([jpeg, Buffer.from("<?php echo 1;")], "avatar.php", {
      type: "image/jpeg",
    });

    const normalized = await normalizeUploadImage(file);

    expect(normalized.fileName).toBe("avatar.jpg");
    expect(normalized.contentType).toBe("image/jpeg");
    expect(normalized.file.includes(Buffer.from("<?php"))).toBe(false);
  });
});
