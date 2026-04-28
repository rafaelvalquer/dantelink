import { connectToMongo } from "../config/mongo.js";
import MyPage from "../models/MyPage.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { normalizeSlug } from "../utils/slug.js";

const seedUser = {
  email: "demo@dandelink.local",
  password: "12345678",
  displayName: "Mutantwear",
};

const seedPage = {
  title: "Mutantwear",
  slug: normalizeSlug("mutantwear"),
  bio: "Viva a Mutacao.",
  avatarUrl: "https://placehold.co/160x160/png?text=MW",
  theme: {
    backgroundColor: "#c4b5fd",
    cardColor: "#f8fafc",
    textColor: "#111827",
    buttonStyle: "rounded-soft",
  },
  links: [],
  secondaryLinks: [],
  shop: {
    isActive: true,
    title: "Ver loja completa",
    description: "0 produtos",
    productsCount: 0,
    products: [],
  },
};

async function seedAuthMyPage() {
  await connectToMongo();

  let user = await User.findOne({ email: seedUser.email });

  if (!user) {
    user = await User.create({
      email: seedUser.email,
      passwordHash: await hashPassword(seedUser.password),
      displayName: seedUser.displayName,
    });
  }

  let page = await MyPage.findOne({ ownerId: user._id }).sort({ createdAt: 1 });

  if (!page) {
    await MyPage.create({
      ownerId: user._id,
      ...seedPage,
    });
    console.log("Conta demo e pagina inicial criadas.");
    return;
  }

  page.title = seedPage.title;
  page.slug = seedPage.slug;
  page.bio = seedPage.bio;
  page.avatarUrl = seedPage.avatarUrl;
  page.theme = seedPage.theme;
  page.links = seedPage.links;
  page.secondaryLinks = seedPage.secondaryLinks;
  page.shop = seedPage.shop;

  await page.save();
  console.log("Pagina demo atualizada.");
}

seedAuthMyPage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha ao executar o seed", error);
    process.exit(1);
  });
