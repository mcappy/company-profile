/* eslint-disable */
import {onDocumentCreated} from "firebase-functions/firestore";
import {logger} from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";
import {Status} from "../types";
import pptxgen from "pptxgenjs";
import {getDownloadURL, getStorage} from "firebase-admin/storage";

const firestore = getFirestore();
const storage = getStorage();

export const presentation = onDocumentCreated("company-profile/{symbol}", async (event) => {
    const symbol = event.params.symbol;
    try {
        const data = event.data;
        logger.info("creating presentation", {symbol});
        const name: string = data?.get("name");
        const pres = buildPresentation(name);

        // Save presentation to Cloud Storage
        const presBlob = await pres.write({outputType: 'uint8array'}) as Uint8Array<ArrayBufferLike>;
        const bucket = storage.bucket();
        const file = bucket.file(`presentations/${symbol}.pptx`);
        await file.save(presBlob);

        // Get download url
        const url = await getDownloadURL(file);

        // Update Firestore document with download URL
        await firestore.collection("company-profile").doc(symbol).update({
            status: Status.Created,
            downloadUrl: url
        });
    } catch (error) {
        // @ts-ignore
        logger.error("Error creating presentation for symbol", {symbol, error: error.message});
    }
});

const buildPresentation = (name: string) => {
    let pres = new pptxgen();
    let slide = pres.addSlide();
    slide.addText(name, {x: 1, y: 1, fontSize: 18, color: "363636"});
    return pres;
}