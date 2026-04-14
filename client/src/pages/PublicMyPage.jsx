import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicMyPage } from "../app/api.js";
import PublicPageScene from "../components/public/PublicPageScene.jsx";

export default function PublicMyPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicPage() {
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

    loadPublicPage();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="public-shell public-shell--centered">Carregando página...</div>;
  }

  if (error) {
    return <div className="public-shell public-shell--centered">{error}</div>;
  }

  return (
    <div className="public-shell">
      <PublicPageScene page={page} />
    </div>
  );
}
