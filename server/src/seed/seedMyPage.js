import { connectToMongo } from "../config/mongo.js";
import MyPage from "../models/MyPage.js";
import {
  createSecondaryLinkId,
} from "../utils/ids.js";
import { normalizeSlug } from "../utils/slug.js";

const seedData = {
  title: "Mutantwear",
  slug: normalizeSlug("mutantwear"),
  bio: "Viva a Mutação.",
  avatarUrl: "https://placehold.co/160x160/png?text=MW",
  theme: {
    backgroundColor: "#c4b5fd",
    cardColor: "#f8fafc",
    textColor: "#111827",
    buttonStyle: "rounded-soft",
  },
  links: [],
  secondaryLinks: [
    {
      id: createSecondaryLinkId(),
      title: "Instagram",
      url: "https://www.instagram.com/use.mutant/",
      isActive: true,
      order: 0,
      platform: "instagram",
      handle: "use.mutant",
    },
  ],
  shop: {
    isActive: true,
    title: "Ver loja completa",
    description: "0 produtos",
    productsCount: 0,
    products: [],
  },
};

async function seedMyPage() {
  await connectToMongo();

  const existing = await MyPage.findOne().sort({ createdAt: 1 });

  if (!existing) {
    await MyPage.create(seedData);
    console.log("Página inicial criada.");
    return;
  }

  existing.title = seedData.title;
  existing.slug = seedData.slug;
  existing.bio = seedData.bio;
  existing.avatarUrl = seedData.avatarUrl;
  existing.theme = seedData.theme;
  existing.links = seedData.links;
  existing.secondaryLinks = seedData.secondaryLinks;
  existing.shop = seedData.shop;

  await existing.save();
  console.log("Página inicial atualizada.");
}

seedMyPage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha ao executar o seed", error);
    process.exit(1);
  });
