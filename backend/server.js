import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import { MongoClient, ObjectId, GridFSBucket } from "mongodb";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);

// Mongo setup
const client = new MongoClient(process.env.MONGODB_URI);
let db, bucket, metaCol;

async function initMongo() {
  try {
    await client.connect();
    db = client.db();
    bucket = new GridFSBucket(db, { bucketName: "recording" });
    metaCol = db.collection("recording_meta");

    // Test connection
    await db.command({ ping: 1 });
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

// Upload (multer to memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 200 }, // 200MB
});


app.post("/api/recording", upload.single("file"), async (req, res) => {
  try {
    if (!bucket || !metaCol)
      return res.status(503).json({ error: "DB not ready" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { title, durationMs } = req.body;
    const filename = req.file.originalname || `recording-${Date.now()}.webm`;

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype || "video/webm",
    });

    const gridfsId = uploadStream.id;
    uploadStream.end(req.file.buffer);

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    });

    uploadStream.on("finish", async (file) => {
      const meta = {
        gridfsId, 
        filename: uploadStream.filename,
        contentType: uploadStream.options.contentType || "video/webm",
        length: uploadStream.length,
        chunkSize: uploadStream.chunkSize,
        uploadDate: uploadStream.uploadDate,
        title: title || uploadStream.filename,
        size: req.file.size,
        durationMs: Number(durationMs) || null,
        createdAt: new Date(),
      };
      const { insertedId } = await metaCol.insertOne(meta);
      const base = process.env.BASE_URL?.replace(/\/$/, "") || "";
      res.status(201).json({
        id: insertedId,
        title: meta.title,
        size: meta.size,
        createdAt: meta.createdAt,
        url: `${base}/api/recording/${insertedId}`,
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/api/recording", async (req, res) => {
  try {
    if (!metaCol) return res.status(503).json({ error: "DB not ready" });

    const items = await metaCol.find({}).sort({ createdAt: -1 }).toArray();
    const base = process.env.BASE_URL?.replace(/\/$/, "") || "";
    const mapped = items.map((it) => ({
      id: it._id,
      title: it.title,
      size: it.size,
      createdAt: it.createdAt,
      url: `${base}/api/recording/${it._id}`,
    }));
    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/recording/:id", async (req, res) => {
  try {
    if (!bucket || !metaCol) return res.status(503).send("DB not ready");

    const id = new ObjectId(req.params.id);
    const meta = await metaCol.findOne({ _id: id });
    if (!meta) return res.status(404).send("Not found");

    res.setHeader("Content-Type", meta.contentType || "video/webm");
    res.setHeader("Content-Disposition", `inline; filename="${meta.filename}"`);

    const download = bucket.openDownloadStream(meta.gridfsId);
    download.on("error", () => res.status(404).end());
    download.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(400).send("Bad id");
  }
});

app.get("/", (req, res) => res.send("Tab Recorder API OK"));


initMongo().then(() => {
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`API listening on ${port}`));
});
