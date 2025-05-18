import admin, { ServiceAccount } from "firebase-admin";
import serviceAccount from "../../firebase-adminsdk.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  storageBucket: "social-media-e435b.firebasestorage.app",
});

const bucket = admin.storage().bucket();

export { bucket };
