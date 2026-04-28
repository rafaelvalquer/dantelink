import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicMyPage, trackPublicPageView } from "../app/api.js";
import PublicShopView from "../components/public/PublicShopView.jsx";

export default function PublicShopPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicShop() {
      try {
        setLoading(true);
        setError("");
        const response = await getPublicMyPage(slug);
        if (!active) return;
        setPage(response.page);
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPublicShop();

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    void trackPublicPageView(slug, {
      pathname: window.location.pathname,
      search: window.location.search,
    });
  }, [slug]);

  if (loading) {
    return <div className="public-shell public-shell--centered">Carregando loja...</div>;
  }

  if (error) {
    return <div className="public-shell public-shell--centered">{error}</div>;
  }

  return (
    <div className="public-shell">
      <PublicShopView page={page} />
    </div>
  );
}
