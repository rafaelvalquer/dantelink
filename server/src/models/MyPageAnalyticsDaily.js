import mongoose from "mongoose";

const metricBucketSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    byOrigin: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false },
);

const myPageAnalyticsDailySchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MyPage",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    pageViewsTotal: { type: Number, default: 0 },
    pageViewsByOrigin: {
      type: Map,
      of: Number,
      default: {},
    },
    linkClicksByLinkId: {
      type: Map,
      of: metricBucketSchema,
      default: {},
    },
    productClicksByProductId: {
      type: Map,
      of: metricBucketSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

myPageAnalyticsDailySchema.index(
  { pageId: 1, dateKey: 1 },
  { unique: true, name: "uniq_page_daily_analytics" },
);

const MyPageAnalyticsDaily =
  mongoose.models.MyPageAnalyticsDaily
  || mongoose.model("MyPageAnalyticsDaily", myPageAnalyticsDailySchema);

export default MyPageAnalyticsDaily;
