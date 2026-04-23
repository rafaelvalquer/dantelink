import { getButtonPreviewProps } from "../public/buttonTheme.js";
import {
  getMyPageButtonIcon,
  getMyPagePrimaryLinkLabel,
} from "../public/myPageTheme.js";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getContentAlignClassName(theme) {
  return theme?.design?.primaryButtonContentAlign === "left" ||
    theme?.design?.primaryButtonContentAlign === "right"
    ? "is-content-left"
    : "is-content-center";
}

export default function ButtonThemePreview({
  theme,
  links = [],
  variant = "primary",
  className = "",
}) {
  const items = Array.isArray(links) ? links.slice(0, 2) : [];
  const contentAlignClassName = getContentAlignClassName(theme);

  return (
    <div className={cls("design-button-preview", className)}>
      {items.map((link) => {
        const Icon = getMyPageButtonIcon(link);
        const buttonProps = getButtonPreviewProps(theme, variant, "design-button-preview__item");
        const iconStyle = getButtonPreviewProps(theme, "secondary").style;

        return (
          <div key={link.id || link.title} className={buttonProps.className} style={buttonProps.style}>
            <div className="design-button-preview__icon" style={iconStyle}>
              <Icon size={14} />
            </div>
            <div className={cls("design-button-preview__copy", contentAlignClassName)}>
              <strong>{getMyPagePrimaryLinkLabel(link)}</strong>
            </div>
            <div className="design-button-preview__balance" aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
