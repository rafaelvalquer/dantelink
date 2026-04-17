import { connectToMongo } from "../config/mongo.js";
import MyPage from "../models/MyPage.js";

async function removeCollectionsFromMyPage() {
  await connectToMongo();

  const result = await MyPage.updateMany({}, { $unset: { collections: 1 } });

  console.log(
    `Campo collections removido de ${result.modifiedCount || 0} documento(s).`,
  );
}

removeCollectionsFromMyPage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha ao limpar collections de MyPage", error);
    process.exit(1);
  });
