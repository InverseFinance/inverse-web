export const POA_VERSION = '1.0.0';

export const POA_TEXTS = {
    '1.0.0': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
    ],
}

export const POA_CURRENT_TEXTS = POA_TEXTS[POA_VERSION];
export const POA_CURRENT_MSG_TO_SIGN = POA_CURRENT_TEXTS.join('\n\n');