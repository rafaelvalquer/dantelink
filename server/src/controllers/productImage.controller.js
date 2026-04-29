import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { ensureUploadsDir, productUploadsDir, uploadsRoot } from "../config/uploads.js";
import { createHttpError } from "../utils/httpError.js";
import { getRequestLogContext, logInfo, logWarn } from "../utils/logger.js";

ensureUploadsDir();

const IMAGE_CONTENT_TYPE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function buildUploadUrl(req, filePath) {
  const relativePath = path.relative(uploadsRoot, filePath).replace(/\\/g, "/");
  return `${getBaseUrl(req)}/uploads/${relativePath}`;
}

function isLocalUploadUrl(req, imageUrl = "") {
  try {
    const parsed = new URL(String(imageUrl || "").trim());
    return (
      parsed.origin === getBaseUrl(req) &&
      parsed.pathname.startsWith("/uploads/")
    );
  } catch {
    return false;
  }
}

function resolveProductImageExtension(contentType = "", imageUrl = "") {
  const normalizedContentType = String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (IMAGE_CONTENT_TYPE_EXTENSIONS[normalizedContentType]) {
    return IMAGE_CONTENT_TYPE_EXTENSIONS[normalizedContentType];
  }

  try {
    const extension = path.extname(new URL(imageUrl).pathname || "").toLowerCase();
    if (extension && extension.length <= 6) {
      return extension;
    }
  } catch {
    return ".png";
  }

  return ".png";
}

function createProductImageFilename(contentType = "", imageUrl = "") {
  const extension = resolveProductImageExtension(contentType, imageUrl);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `product-${uniqueSuffix}${extension}`;
}

export async function uploadProductImageHandler(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, "Selecione uma imagem para continuar.", "PRODUCT_IMAGE_REQUIRED");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = path.relative(uploadsRoot, req.file.path).replace(/\\/g, "/");
    const url = `${baseUrl}/uploads/${relativePath}`;

    logInfo("product-image.uploaded", {
      ...getRequestLogContext(req),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      ok: true,
      url,
      message: "Imagem do produto enviada com sucesso.",
    });
  } catch (error) {
    next(error);
  }
}

export async function internalizeProductImageFromUrlHandler(req, res, next) {
  let filePath = "";

  try {
    const imageUrl = String(req.body?.imageUrl || "").trim();

    if (!/^https?:\/\//i.test(imageUrl)) {
      throw createHttpError(
        400,
        "Informe uma URL valida de imagem para continuar.",
        "PRODUCT_IMAGE_URL_INVALID",
      );
    }

    if (isLocalUploadUrl(req, imageUrl)) {
      logInfo("product-image.internalize.skipped-local", {
        ...getRequestLogContext(req),
        imageUrl,
      });
      res.status(200).json({
        ok: true,
        url: imageUrl,
        message: "Imagem já está disponível localmente.",
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;

    try {
      response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "dandelink/1.0 (product image importer)",
          Accept: "image/*,*/*;q=0.8",
        },
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        logWarn("product-image.internalize.timeout", {
          ...getRequestLogContext(req),
          imageUrl,
        });
        throw createHttpError(
          504,
          "A imagem demorou demais para responder. Envie o arquivo manualmente.",
          "PRODUCT_IMAGE_DOWNLOAD_TIMEOUT",
        );
      }

      logWarn("product-image.internalize.download-failed", {
        ...getRequestLogContext(req),
        imageUrl,
      });
      throw createHttpError(
        502,
        "Não foi possível baixar a imagem informada. Envie o arquivo manualmente.",
        "PRODUCT_IMAGE_DOWNLOAD_FAILED",
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      logWarn("product-image.internalize.download-status", {
        ...getRequestLogContext(req),
        imageUrl,
        status: response.status,
      });
      throw createHttpError(
        502,
        "Não foi possível baixar a imagem informada. Envie o arquivo manualmente.",
        "PRODUCT_IMAGE_DOWNLOAD_FAILED",
      );
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();

    if (!contentType.startsWith("image/")) {
      throw createHttpError(
        400,
        "A URL informada não retornou uma imagem válida.",
        "PRODUCT_IMAGE_INVALID_CONTENT_TYPE",
      );
    }

    if (!response.body) {
      throw createHttpError(
        502,
        "Não foi possível ler a imagem informada. Envie o arquivo manualmente.",
        "PRODUCT_IMAGE_EMPTY_BODY",
      );
    }

    const filename = createProductImageFilename(contentType, imageUrl);
    filePath = path.join(productUploadsDir, filename);

    await pipeline(
      Readable.fromWeb(response.body),
      createWriteStream(filePath),
    );

    logInfo("product-image.internalized", {
      ...getRequestLogContext(req),
      imageUrl,
      contentType,
    });

    res.status(201).json({
      ok: true,
      url: buildUploadUrl(req, filePath),
      message: "Imagem pronta para recorte.",
    });
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      await unlink(filePath).catch(() => {});
    }

    next(error);
  }
}
