const express = require("express");
const app = express();

const sharp = require("sharp");
const fs = require("fs");

// /image/${fileName}?w=${width}&h=${height}&format={avif/webp/jpeg}
// automatically figures out what format is best/supported
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

// a small test to see if images are being served in the correct format
app.get("/", (req, res) => {
  cleanUpImages();
  res.send(
    '<img src="http://localhost:3000/images/cat" style="margin-left:14%; margin-top:7%;">'
  );
});

// todo make a small frontend to upload images
// maybe a dropzone?
// maybe auth with firebase?
// and why not store the images in firebase?

// if image server is on the internet, how do we prevent abuse?
// maybe use a captcha?
// maybe store which ip addresses generate images?
// how many images can be generated per ip address?
// maybe rate limit to 15 images per hour?

// loop through all files in the images folder
// delete generated images that are older than a time period
function cleanUpImages() {
  let folders = fs.readdirSync(__dirname + "/images");
  folders.forEach((folder) => {
    let files = fs.readdirSync(__dirname + `/images/${folder}`);
    files.forEach((file) => {
      // use regex to check if generated or original by checking if it follows the pattern
      let regex = /(?:\d+)?x(?:\d+)?\.\w+/;
      // make sure that at least one of the numbers is in the file name
      // to not match files with names like "matrix.jpg"
      if (!file.includes(folder) && regex.test(file)) {
        let createdAt = fs.statSync(
          __dirname + `/images/${folder}/${file}`
        ).birthtimeMs;
        let hoursToDelete = 1;
        let timeToDelete = hoursToDelete * 60 * 60 * 1000;
        if (Date.now() - createdAt > timeToDelete) {
          console.log(
            `${folder}/${file} is older than ${hoursToDelete} hours.`
          );
        }
      }
    });
  });
}

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
