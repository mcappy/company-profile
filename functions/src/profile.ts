import express from "express";
import {logger} from "firebase-functions";
import {CompanyProfile, SECProfile, Status} from "./types";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

const app = express();
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
      logger.error(`failed to fetch SEC profile for ${symbol}`, {status: response.status, statusText: response.statusText});
      throw new Error(`failed to fetch SEC profile: ${response.statusText}`);
    }
    const json: SECProfile[] = await response.json();
    if (json.length === 0) {
      throw new Error(`no profile found for symbol: ${symbol}`);
    }
    return json[0];
  } catch (error) {
    // eslint-disable-next-line max-len
    logger.error(`error fetching SEC profile for ${symbol}`, {error});
    throw new Error(`error fetching SEC profile: ${error}`);
  }
};

app.post("/profile/:symbol", async (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) {
    res.status(400).send("symbol is required");
    return;
  }
  try {
    logger.info("creating profile for symbol", symbol);
    // eslint-disable-next-line max-len
    // Check if profile already exists in Firestore and still return a success response if it does
    // eslint-disable-next-line max-len
    const doc = await firestore.collection("company-profile").doc(symbol).get();
    if (doc.exists) {
      logger.info("profile already exists", {symbol});
      res.status(200).send("profile already exists");
      return;
    }

    const secProfile = await fetchSECProfile(symbol);

    // Delete profiles 24 hours after creation
    const ttl = new Date();
    ttl.setDate(ttl.getDate() + 1);

    const profile: CompanyProfile = {
      symbol: secProfile.symbol,
      cik: secProfile.cik,
      description: secProfile.description,
      status: Status.New,
      ttl: Timestamp.fromDate(ttl),
    };
    // eslint-disable-next-line max-len
    logger.info("profile fetched successfully", {profile_description: profile.description});
    // Add the company stock ticker and description in Firestore
    // eslint-disable-next-line max-len
    const writeResult = await firestore.collection("company-profile").doc(symbol).set(profile);
    logger.info("profile created successfully", {writeResult});
    res.status(201).send("profile created successfully");
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    logger.error("error creating profile", {error: error.message});
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.status(500).send(`error creating profile: ${error.message}`);
  }
});

export const api = onRequest({secrets: [FMP_API_KEY]}, app);
