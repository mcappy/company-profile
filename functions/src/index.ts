import {initializeApp} from "firebase-admin/app";
import express from "express";
import {CompanyProfile, SECProfile, Status} from "./types";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import {onRequest} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/firestore";

const app = express();
initializeApp();
const FMP_API_KEY = defineSecret("FMP_API_KEY");
const firestore = getFirestore();

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line max-len
const fetchSECProfile = async (symbol: string): Promise<SECProfile> => {
  const url = `https://financialmodelingprep.com/stable/sec-profile?symbol=${symbol}&apikey=${FMP_API_KEY.value()}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // eslint-disable-next-line max-len
      logger.error(`Failed to fetch SEC profile for ${symbol}`, {status: response.status, statusText: response.statusText});
      throw new Error(`Failed to fetch SEC profile: ${response.statusText}`);
    }
    const json: SECProfile[] = await response.json();
    if (json.length === 0) {
      throw new Error(`No profile found for symbol: ${symbol}`);
    }
    return json[0];
  } catch (error) {
    // eslint-disable-next-line max-len
    logger.error(`Error fetching SEC profile for ${symbol}`, {error});
    throw new Error(`Error fetching SEC profile: ${error}`);
  }
};

app.post("/profile/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) {
    res.status(400).send("Symbol is required");
    return;
  }
  try {
    logger.info("Creating profile for symbol", symbol);
    // eslint-disable-next-line max-len
    // Check if profile already exists in Firestore and still return a success response if it does
    // eslint-disable-next-line max-len
    const doc = await firestore.collection("company-profile").doc(symbol).get();
    if (doc.exists) {
      logger.info("Profile already exists", {symbol});
      res.status(200).send("Profile already exists");
      return;
    }

    const secProfile = await fetchSECProfile(symbol);
    const profile: CompanyProfile = {
      symbol: secProfile.symbol,
      cik: secProfile.cik,
      description: secProfile.description,
      status: Status.New,
    };
    // eslint-disable-next-line max-len
    logger.info("Profile fetched successfully", {profile_description: profile.description});
    // Add the company stock ticker and description in Firestore
    // eslint-disable-next-line max-len
    const writeResult = await firestore.collection("company-profile").doc(symbol).set(profile);
    logger.info("Profile created successfully", {writeResult});
    res.status(201).send("Profile created successfully");
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logger.error("Error creating profile", {error: error.message});
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.status(500).send(`Error creating profile: ${error.message}`);
  }
});

// eslint-disable-next-line max-len
const presentation = onDocumentCreated("company-profile/{symbol}", async (event) => {
  const data = event.data;
  const symbol = event.params.symbol;
  logger.info("New profile created", {symbol, data});

  // Wait 15 seconds and update the documents status to PresentationCreated
  setTimeout(async () => {
    try {
      // eslint-disable-next-line max-len
      await firestore.doc(`company-profile/${symbol}`).update({status: "PRESENTATION_CREATED"});
      // eslint-disable-next-line max-len
      logger.info("Profile status updated", {symbol, status: "PRESENTATION_CREATED"});
    } catch (error) {
      // eslint-disable-next-line max-len,@typescript-eslint/ban-ts-comment
      // @ts-ignore
      logger.error("Error updating profile status", {error: error.message});
    }
  }, 15000);
});


exports.api = onRequest({secrets: [FMP_API_KEY]}, app);
exports.presentation = presentation;


