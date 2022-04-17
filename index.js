const express = require("express");
const app = express();

const sharp = require("sharp");
const fs = require("fs");

// create a simple test
app.get("/", (req, res) => {
  res.send(
    '<img src="http://localhost:3000/images/cat" style="margin-left:14%; margin-top:7%;">'
  );
});
// for all requests to /images
// and send it back
// :image = filename without extension
// /image/${fileName}?w=${width}&h=${height}&format={avif/webp/jpeg} automatically figures out what format is best/supported
// example: /image/cat?w=200&h=200&format=jpeg
app.get("/images/:image", (req, res) => {
  // name on disk = width ? height ? format
  // example: 200x200.jpeg
  // check if w and h exist
  let fileName;
  // if w and h exist, limit both to 1000 and add to filename
  if (req.query.w && req.query.h) {
    req.query.w = Math.min(req.query.w, 1000);
    req.query.h = Math.min(req.query.h, 1000);
    fileName = req.query.w + "x" + req.query.h;
    // if only w exists, limit w to 1000 and add to filename
  } else if (req.query.w) {
    req.query.w = Math.min(req.query.w, 1000);
    fileName = req.query.w + "x";
    // if only h exists, limit h to 1000 and add to filename
  } else if (req.query.h) {
    req.query.h = Math.min(req.query.h, 1000);
    fileName = "x" + req.query.h;
    // if neither w nor h exist, add nothing to filename
  } else {
    fileName = req.params.image;
  }
  // figures out what format is best/supported
  // todo get the format from the request params
  let format = req.accepts([
    "avif",
    "webp",
    "heif",
    "jpeg",
    "jpg",
    "png",
    "bmp",
    "gif",
    "ico",
  ]);

  // check that we have original on file so we can resize
  // and can return a 404 if not
  let originalPath = findOriginalImagePath(req);
  if (originalPath) {
    // check user agent image support
    if (!format) {
      // if the browser doesn't support any of the formats
      // send back a 406 error (not acceptable)
      res.status(406).send(`
                  Sorry, your current browser does not support avif, webp, jpeg, jpg, png.
                  Please try another browser or update your browser to the latest version.
              `);
    }
    let path =
      __dirname + `\\images\\${req.params.image}\\${fileName}.${format}`;
    // set content type to avif
    res.set("Content-Type", `image/${format}`);
    // check if avif exists?
    if (fs.existsSync(path)) {
      // send avif
      res.sendFile(path);
    } else {
      // generate avif and resize it to requested size
      sharp(originalPath)
        .resize(req.query.w, req.query.h)
        .toFile(path, (err, info) => {
          if (err) {
            console.log(err);
          }
          // send avif
          res.sendFile(path);
        });
    }
  } else {
    // if not, send back a 404
    res.status(404).send("Image not found");
  }
});

// start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
function findOriginalImagePath(req) {
  let extensions = [".jpg", ".png", ".jpeg"];
  let originalPath = "";
  extensions.forEach((ext) => {
    let path =
      __dirname + `\\images\\${req.params.image}\\${req.params.image}${ext}`;
    if (fs.existsSync(path)) {
      originalPath = path;
      return;
    }
  });
  return originalPath;
}
