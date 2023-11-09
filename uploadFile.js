const { initializeApp } = require("firebase/app");
const { deleteObject, uploadString } = require("firebase/storage");
const { getStorage, ref, getDownloadURL } = require("firebase/storage");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
const uploadFile = multerConfig.single("file");

class Upload {
  firebaseStorage;
  filePath;
  upload;
  next;

  constructor(filePath) {
    const firebaseConfig = {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      measurementId: process.env.MEASUREMENT_ID,
    };
    const firebaseApp = initializeApp(firebaseConfig);
    this.firebaseStorage = getStorage(firebaseApp);
    this.filePath = filePath;
    this.upload = { url: "" };
  }

  bufferToBase64(buffer) {
    return Buffer.from(buffer).toString("base64");
  }

  path(filePath) {
    const isProduction = process.env.NODE_ENV === "production";
    if (!filePath) {
      throw new Error("No file path provided!");
    }
    if (filePath.startsWith("/")) {
      throw new Error("Invalid file path!");
    }
    if (isProduction) return `prod/${filePath}`;
    if (!isProduction) return `dev/${filePath}`;
  }

  async add(file) {
    try {
      const reference = ref(this.firebaseStorage, this.path(this.filePath));
      const fileBase64 = this.bufferToBase64(file.buffer);

      await uploadString(reference, fileBase64, "base64");
      this.upload.url = await getDownloadURL(reference);

      return this.upload;
    } catch (err) {
      console.log("err", err);
      if (err) throw new Error("Sorry, error occurred while uploading!");
    }
  }

  async update(file, savedFilePath) {
    try {
      let reference = ref(this.firebaseStorage, this.path(this.filePath));
      const fileBase64 = this.bufferToBase64(file.buffer);
      await uploadString(reference, fileBase64, "base64");
      const URL = await getDownloadURL(reference);

      // delete the saved file
      reference = ref(this.firebaseStorage, this.path(savedFilePath));
      if (URL) {
        await deleteObject(reference);
      }
      this.upload.url = URL;

      return this.upload;
    } catch (err) {
      console.log("err", err);
      if (err) throw new Error("Sorry, error occurred while uploading!");
    }
  }
  async delete() {
    try {
      const reference = ref(this.firebaseStorage, this.path(this.filePath));
      await deleteObject(reference);
    } catch (err) {
      console.log("err", err);
      if (err) throw new Error("Sorry, error occurred while deleting");
    }
  }
}

module.exports = { Upload, uploadFile };