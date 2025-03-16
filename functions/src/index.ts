import {initializeApp} from "firebase-admin/app";

// Initialize the Firebase Admin SDK
// This must be done before importing cloud functions
initializeApp();

import {api} from "./profile";
import {presentation} from "./presentation";

exports.api = api;
exports.presentation = presentation;


