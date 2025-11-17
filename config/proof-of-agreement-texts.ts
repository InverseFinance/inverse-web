export const POA_VERSION = '1.0.5';

// Note: should be maximum 1024 characters (limit on Trezor for example)
export const POA_TEXTS = {
    '1.0.0': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
    ],
    // minor diff to allow multisigs to sign again after multisig support was added
    '1.0.1': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and that displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
    ],
    // add UK
    '1.0.2': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or UK or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and that displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
    ],
    '1.0.3': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments thereto. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or UK or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and that displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
        `Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you should not expect to be protected if something goes wrong. Take time to learn more before investing or using the Site.`,
    ],
    // limit to 1024 characters (wallet signature limit on some devices)
    '1.0.4': [
        `I have read and understood, and do hereby agree as a "User" to the Terms, including all future amendments. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA or UK or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and that displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
        `Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you should not expect to be protected if something goes wrong. Take time to learn more before investing or using the Site.`,
    ],
    '1.0.5': [
        `I have read and understood, and agree as a "User" to the Terms, including all future amendments. Such agreement is irrevocable and will apply to all of the Site.`,
        `I'm at least 18 years of age (or the age of legal majority in the jurisdiction in which I reside), and not a citizen or resident of the USA, UK or UAE or subject to any personal, national or international Sanctions.`,
        `I acknowledge and agree that the Site solely provides access and information for data on the blockchain and that displayed information may be approximate or may contain inaccuracies. I accept that Site operators have no custody over my funds, ability or duty to transact on my behalf or power to reverse my transactions. The Site does not provide any warranty with respect to any of its provided operations.`,
        `Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you should not expect to be protected if something goes wrong. Take time to learn more before investing or using the Site.`,
    ],
}

export const POA_CURRENT_TEXTS = POA_TEXTS[POA_VERSION];
export const POA_CURRENT_MSG_TO_SIGN = POA_CURRENT_TEXTS.join('\n\n');