Inspecting the code is cool, but if you'd rather just check out how it works, you can run it yourself

First, install the project dependencies

```
npm i
```

For regular node, use:

```
npm run watch
```

If you have nodemon installed, you can use:

```
npm run watchmon
```

Then in your browser, open one of the following

http://localhost:3000/images/cat

http://localhost:3000/images/matrix

http://localhost:3000/images/drawing

You can also add a ?w=100&h=200 for resizing the image. Maximum height and width are 1000px.

To upload images:

- Go to /login and then you will be redirected to the upload page.
- Select an image and click upload.
- The image will be uploaded. You can see it by going to /images/{image_name}
- Or find the name in the overview on http://localhost:3000/images
