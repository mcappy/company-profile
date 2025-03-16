// eslint-disable-next-line max-len
import {onDocumentCreated} from "firebase-functions/firestore";
import {logger} from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";

const firestore = getFirestore();

// eslint-disable-next-line max-len
export const presentation = onDocumentCreated("company-profile/{symbol}", async (event) => {
  const data = event.data;
  const symbol = event.params.symbol;
  logger.info("new profile created", {symbol, data});

  // Wait 15 seconds and update the documents status to PresentationCreated
  setTimeout(async () => {
    try {
      // eslint-disable-next-line max-len
      await firestore.doc(`company-profile/${symbol}`).update({status: "PRESENTATION_CREATED"});
      // eslint-disable-next-line max-len
      logger.info("profile status updated", {symbol, status: "PRESENTATION_CREATED"});
    } catch (error) {
      // eslint-disable-next-line max-len,@typescript-eslint/ban-ts-comment
      // @ts-ignore
      logger.error("error updating profile status", {error: error.message});
    }
  }, 15000);
});
