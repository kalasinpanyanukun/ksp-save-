import { runSheetImport } from "../routes/sheet-data.routes.js";

runSheetImport()
  .then((result) => {
    console.log("Import เสร็จสิ้น:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import ล้มเหลว:", err);
    process.exit(1);
  });
