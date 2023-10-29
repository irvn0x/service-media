const express = require("express");
const router = express.Router();
const isBase64 = require("is-base64");
const base64Img = require("base64-img");
const fs = require("fs");

const { Media } = require("../models");

// Route Get List
router.get("/", async (req, res) => {
  const media = await Media.findAll({
    // Hanya menampilkan id dan image, created_at dan updated_at tidak akan nampil
    attributes: ["id", "image"],
  });

  // Mengubah menjadi url yang bisa dipanggil
  const mappedMedia = media.map((m) => {
    m.image = `${req.get("host")}/${m.image}`;
    return m;
  });

  return res.json({
    status: "success",
    data: mappedMedia,
  });
});

// Route Insert -> Upload Image
router.post("/", (req, res) => {
  const image = req.body.image;

  // Mengecek apakah parameter image adalah base64 atau bukan
  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({ status: "error", message: "invalid base64" });
  }

  // Menyimpan gambar ke dalam folder public/images
  base64Img.img(image, "./public/images", Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message });
    }

    const filename = filepath.split("\\").pop();

    const media = await Media.create({ image: `images/${filename}` });

    return res.json({
      status: "success",
      data: {
        id: media.id,
        image: `http://${req.get("host")}/images/${filename}`,
      },
    });
  });
});

// Route Delete
router.delete("/:id", async (req, res) => {
  // Get/Ambil parameter id
  const id = req.params.id;

  // Mengecek id apakah ada didatabase atau tidak
  const media = await Media.findByPk(id);

  if (!media) {
    return res
      .status(404)
      .json({ status: "error", message: "media not found" });
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    // Jika error
    if (err) {
      return res.status(400).json({ status: "error", message: err.message });
    }

    // Jika ditemukan maka akan dihapus
    await media.destroy();

    return res.json({
      status: "success",
      message: "image deleted",
    });
  });
});

module.exports = router;
