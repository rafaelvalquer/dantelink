import PublicPageRenderer from "../public/PublicPageRenderer.jsx";

export default function PhonePreview({ page }) {
  return (
    <div className="phone-preview">
      <div className="phone-preview__frame">
        <div className="phone-preview__speaker" />
        <div className="phone-preview__screen">
          <PublicPageRenderer page={page} mode="preview" interactive={false} />
        </div>
      </div>
    </div>
  );
}
