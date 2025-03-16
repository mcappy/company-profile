/* eslint-disable */
import express from "express";
import {logger} from "firebase-functions";
import {CompanyProfile, SECProfile, Status} from "../types";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore, Timestamp} from "firebase-admin/firestore";

const app = express();
const FMP_API_KEY = defineSecret("FMP_API_KEY");
const firestore = getFirestore();

const fetchSECProfile = async (symbol: string, useMock?: boolean): Promise<SECProfile> => {
    if (useMock) {
        return {
            symbol: "AAPL",
            cik: "0000320193",
            registrantName: "Apple Inc.",
            sicDescription: "Electronic Computers",
            city: "Cupertino",
            state: "CA",
            country: "US",
            description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod. It also provides AppleCare support and cloud services; and operates various platforms, including the App Store that allow customers to discover and download applications and digital content, such as books, music, video, games, and podcasts, as well as advertising services include third-party licensing arrangements and its own advertising platforms. In addition, the company offers various subscription-based services, such as Apple Arcade, a game subscription service; Apple Fitness+, a personalized fitness service; Apple Music, which offers users a curated listening experience with on-demand radio stations; Apple News+, a subscription news and magazine service; Apple TV+, which offers exclusive original content; Apple Card, a co-branded credit card; and Apple Pay, a cashless payment service, as well as licenses its intellectual property. The company serves consumers, and small and mid-sized businesses; and the education, enterprise, and government markets. It distributes third-party applications for its products through the App Store. The company also sells its products through its retail and online stores, and direct sales force; and third-party cellular network carriers, wholesalers, retailers, and resellers. Apple Inc. was founded in 1976 and is headquartered in Cupertino, California.",
            ceo: "Mr. Timothy D. Cook",
            website: "https://www.apple.com",
            ipoDate: "1980-12-12",
            employees: "150000",
            fiftyTwoWeekRange: "164.08 - 260.1",
        }
    }
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

        const secProfile = await fetchSECProfile(symbol, true);

        // Delete profiles 24 hours after creation
        const ttl = new Date();
        ttl.setDate(ttl.getDate() + 1);

        const profile: CompanyProfile = {
            symbol: secProfile.symbol,
            cik: secProfile.cik,
            description: secProfile.description,
            status: Status.InProgress,
            ttl: Timestamp.fromDate(ttl),
            name: secProfile.registrantName,
            ceo: secProfile.ceo,
            city: secProfile.city,
            state: secProfile.state,
            country: secProfile.country,
            website: secProfile.website,
            employees: secProfile.employees,
        };
        logger.info("profile fetched successfully", {profile_description: profile.description});
        // Add the company stock ticker and description in Firestore
        const writeResult = await firestore.collection("company-profile").doc(symbol).set(profile);
        logger.info("profile created successfully", {writeResult});
        res.status(201).send("profile created successfully");
    } catch (error) {
        // @ts-ignore
        logger.error("error creating profile", {error: error.message});
        // @ts-ignore
        res.status(500).send(`error creating profile: ${error.message}`);
    }
});

export const api = onRequest({secrets: [FMP_API_KEY]}, app);
