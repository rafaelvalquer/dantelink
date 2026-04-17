import PublicPageSceneView from "../public/PublicPageSceneView.jsx";
import { getMyPageTheme } from "../public/myPageTheme.js";

export default function PhonePreview({ page }) {
  const theme = getMyPageTheme(page || {});

  return (
    <div className="phone-preview">
      <div
        className="phone-preview__frame"
        style={{
          boxShadow: `0 36px 90px -44px ${theme.design?.buttonColor || "#0f172a"}`,
        }}
      >
        <div className="phone-preview__speaker" />
        <div className="phone-preview__screen">
          <div className="phone-preview__status">
            <span>9:41</span>
            <span>Preview ao vivo</span>
          </div>
          <PublicPageSceneView page={page} mode="preview" interactive={false} />
        </div>
      </div>
    </div>
  );
}
