// Accepts JSON { fileName, contentType, fileBase64 } or { dataUrl }.
// Uploads to Azure Blob Storage and returns { ok, blobName, url }.

export default async function (context, req) {
  try {
    const b = req.body || {};
    let { fileName, contentType, fileBase64, dataUrl } = b;

    // allow data URL too
    if (!fileBase64 && typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
      fileBase64 = dataUrl.split(",", 2)[1] || "";
      const mt = dataUrl.slice(5, dataUrl.indexOf(";")); // e.g. "image/png"
      if (!contentType && mt) contentType = mt;
    }

    if (!fileBase64 || typeof fileBase64 !== "string") {
      context.res = {
        status: 400,
        headers: { "content-type": "application/json" },
        body: { error: "Send JSON with { fileBase64: '<base64>' } (optionally fileName, contentType)" }
      };
      return;
    }

    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!conn) {
      context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: "AZURE_STORAGE_CONNECTION_STRING missing" } };
      return;
    }

    const { BlobServiceClient } = await import("@azure/storage-blob");

    const containerName = (process.env.BLOB_CONTAINER || "uploads").toLowerCase();
    const service = BlobServiceClient.fromConnectionString(conn);
    const container = service.getContainerClient(containerName);
    await container.createIfNotExists();

    const safeExt =
      (contentType && contentType.split("/")[1]) ||
      (fileName && fileName.split(".").pop()) ||
      "bin";

    const blobName =
      fileName ||
      `upload_${new Date().toISOString().replace(/[:.]/g, "-")}.${safeExt}`;

    const buffer = Buffer.from(fileBase64, "base64");

    const blob = container.getBlockBlobClient(blobName);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" }
    });

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: { ok: true, blobName, url: blob.url }
    };
  } catch (err) {
    context.log.error("upload error:", err);
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { error: "Upload failed", details: err.message }
    };
  }
}
