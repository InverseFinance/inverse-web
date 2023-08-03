export const POA_VERSION = '1.0.0';

export const POA_TEXTS = {
    '1.0.0': [
        `I have read and understood, and do hereby agree to be legally bound as a "User" under the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or subject to any personal or national Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The site does not provide any warranty with respect to any of its provided operaitons.`,
    ],
}

export const POA_CURRENT_TEXTS = POA_TEXTS[POA_VERSION];
export const POA_CURRENT_MSG_TO_SIGN = POA_CURRENT_TEXTS.join('\n\n');