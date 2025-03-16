import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

// Initialize the Firebase Admin SDK
// IMPORTANT: This must be done before importing cloud functions
initializeApp();
setGlobalOptions({region: "us-east4"});

import {api} from "./profile";
import {presentation} from "./presentation";

exports.api = api;
exports.presentation = presentation;


