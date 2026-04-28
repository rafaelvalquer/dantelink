import { connectToMongo } from "../config/mongo.js";
import MyPage from "../models/MyPage.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const migrationUser = {
  email: "admin@dandelink.local",
  password: "12345678",
  displayName: "Conta migrada",
};

async function migrateSingletonToUser() {
  await connectToMongo();

  const legacyPage = await MyPage.findOne({
    $or: [
      { ownerId: { $exists: false } },
      { ownerId: null },
    ],
  }).sort({ createdAt: 1 });

  if (!legacyPage) {
    console.log("Nenhuma pagina legada sem ownerId foi encontrada.");
    return;
  }

  let user = await User.findOne({ email: migrationUser.email });

  if (!user) {
    user = await User.create({
      email: migrationUser.email,
      passwordHash: await hashPassword(migrationUser.password),
      displayName: migrationUser.displayName,
    });
  }

  legacyPage.ownerId = user._id;
  await legacyPage.save();

  console.log("Pagina legada vinculada ao usuario:", user.email);
}

migrateSingletonToUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha ao migrar pagina legada", error);
    process.exit(1);
  });
