"use strict";
exports.__esModule = true;
exports.bucket = void 0;
var firebase_admin_1 = require("firebase-admin");
var firebase_adminsdk_json_1 = require("../../firebase-adminsdk.json");
firebase_admin_1["default"].initializeApp({
    credential: firebase_admin_1["default"].credential.cert(firebase_adminsdk_json_1["default"]),
    storageBucket: "social-media-e435b.firebasestorage.app"
});
var bucket = firebase_admin_1["default"].storage().bucket();
exports.bucket = bucket;
