import sharp from "sharp";

sharp.block({
  operation: [
    "VipsForeignLoadNsgif",
    "VipsForeignLoadTiff",
    "VipsForeignLoadVips",
  ],
});

export default sharp;
