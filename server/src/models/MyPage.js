import mongoose from "mongoose";
import { normalizeSlug } from "../utils/slug.js";

const linkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, default: "Novo link" },
    url: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["link", "social", "shop-preview"],
      default: "link",
    },
    platform: {
      type: String,
      enum: ["", "instagram", "facebook", "youtube", "tiktok"],
      trim: true,
      default: "",
    },
    handle: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const collectionItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, default: "Novo item" },
    url: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const collectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Nova coleção",
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    items: { type: [collectionItemSchema], default: [] },
  },
  { _id: false },
);

const myPageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "Mutantwear" },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    bio: { type: String, trim: true, default: "Viva a Mutação." },
    avatarUrl: { type: String, trim: true, default: "" },
    theme: {
      backgroundColor: { type: String, trim: true, default: "#c4b5fd" },
      cardColor: { type: String, trim: true, default: "#ffffff" },
      textColor: { type: String, trim: true, default: "#64748b" },
      themePreset: { type: String, trim: true, default: "clean_light" },
      brandLayout: { type: String, trim: true, default: "classic" },
      backgroundStyle: { type: String, trim: true, default: "fill" },
      backgroundGradientDirection: {
        type: String,
        trim: true,
        default: "linear_up",
      },
      backgroundPatternVariant: { type: String, trim: true, default: "grid" },
      surfaceStyle: { type: String, trim: true, default: "soft" },
      surfacePatternVariant: { type: String, trim: true, default: "grid" },
      surfaceColor: { type: String, trim: true, default: "#ffffff" },
      buttonColor: { type: String, trim: true, default: "#0f172a" },
      buttonTextColor: { type: String, trim: true, default: "#ffffff" },
      pageTextColor: { type: String, trim: true, default: "#64748b" },
      titleTextColor: { type: String, trim: true, default: "#0f172a" },
      fontPreset: { type: String, trim: true, default: "inter" },
      buttonStyle: { type: String, trim: true, default: "solid" },
      buttonShadow: { type: String, trim: true, default: "soft" },
      buttonRadius: { type: String, trim: true, default: "round" },
      primaryButtonsLayout: { type: String, trim: true, default: "stack" },
      secondaryLinksStyle: { type: String, trim: true, default: "icon_text" },
      secondaryLinksIconLayout: {
        type: String,
        trim: true,
        default: "brand_badge",
      },
      secondaryLinksSize: { type: String, trim: true, default: "medium" },
      secondaryLinksAlign: { type: String, trim: true, default: "center" },
      animationPreset: { type: String, trim: true, default: "subtle" },
    },
    links: { type: [linkSchema], default: [] },
    collections: { type: [collectionSchema], default: [] },
    shop: {
      isActive: { type: Boolean, default: true },
      title: { type: String, trim: true, default: "Ver loja completa" },
      description: { type: String, trim: true, default: "0 produtos" },
      productsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

myPageSchema.pre("validate", function normalizeMyPageSlug(next) {
  if (this.slug) {
    this.slug = normalizeSlug(this.slug);
  }
  next();
});

const MyPage = mongoose.models.MyPage || mongoose.model("MyPage", myPageSchema);

export default MyPage;
