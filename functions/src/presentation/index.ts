/* eslint-disable */
import {onDocumentCreated} from "firebase-functions/firestore";
import {logger} from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";
import {Status} from "../types";

const firestore = getFirestore();

// eslint-disable-next-line max-len
export const presentation = onDocumentCreated("company-profile/{symbol}", async (event) => {
    const data = event.data;
    const symbol = event.params.symbol;
    logger.info("new profile created", {symbol, data});

    // Wait 15 seconds and update the documents status to PresentationCreated
    setTimeout(async () => {
        try {
            // Update the document status to Created to indicate that the presentation has been created
            // and add a dummy url to the presentation
            await firestore.doc(`company-profile/${symbol}`).update({status: Status.Created, downloadUrl: "https://example.com"});
            // eslint-disable-next-line max-len
            logger.info("profile status updated", {symbol, status: Status.Created});
        } catch (error) {
            // @ts-ignore
            logger.error("error updating profile status", {error: error.message});
        }
    }, 15000);
});
