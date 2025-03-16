import {Timestamp} from "firebase-admin/firestore";

export type SECProfile = {
    symbol: string;
    cik: string;
    // registrantName: string;
    // sicCode: string;
    // sicDescription: string;
    // sicGroup: string;
    // isin: string;
    // businessAddress: string;
    // mailingAddress: string;
    // phoneNumber: string;
    // postalCode: string;
    // city: string;
    // state: string;
    // country: string;
    description: string;
    // ceo: string;
    // website: string;
    // exchange: string;
    // stateLocation: string;
    // stateOfIncorporation: string;
    // fiscalYearEnd: string;
    // ipoDate: string;
    // employees: string;
    // secFilingsUrl: string;
    // taxIdentificationNumber: string;
    // fiftyTwoWeekRange: string;
    // isActive: boolean;
    // assetType: string;
    // openFigiComposite: string;
    // priceCurrency: string;
    // marketSector: string;
    // securityType: string | null;
    // isEtf: boolean;
    // isAdr: boolean;
    // isFund: boolean;
};

export enum Status {
    // eslint-disable-next-line max-len
    // IN_PROGRESS means the company profile has been created and an event has been triggered to create a presentation
    InProgress = "IN_PROGRESS",
    // eslint-disable-next-line max-len
    // Created means the presentation has been created
    Created = "CREATED",
}

export type CompanyProfile = {
    symbol: string;
    cik: string;
    description: string;
    status: Status
    ttl: Timestamp;
}
