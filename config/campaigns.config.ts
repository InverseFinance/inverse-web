export const LIQUIDATION_GRANTS_MSG_TO_SIGN = "Apply to the Inverse Finance Liquidation Grants Program with this account:\r\n";

export const CAMPAIGNS_SETTINGS = {
  'liquidation-grants': {
    title: 'Liquidation Grants Program',
    sigText: LIQUIDATION_GRANTS_MSG_TO_SIGN,
    fields: ['liquidatorType', 'contact'],
    mandatoryFields: ['liquidatorType'],
    to: 'karm@inverse.finance',
    fieldsSettings: {
      liquidatorType: {
        values: ['eoa', 'bot'],
        title: 'Liquidator type',
      },
      contact: {
        maxLength: 100,
        title: 'Contact',
      }
    }
  },
  'liquidation-grants-v1.0.1': {
    title: 'Liquidation Grants Program 1.1',
    sigText: LIQUIDATION_GRANTS_MSG_TO_SIGN,
    fields: ['liquidatorType', 'contact', 'txHash'],
    mandatoryFields: ['liquidatorType', 'txHash'],
    to: 'karm@inverse.finance',
    fieldsSettings: {
      liquidatorType: {
        values: ['eoa', 'bot'],
        title: 'Liquidator type',
      },
      contact: {
        maxLength: 100,
        title: 'Contact',
      },
      txHash: {
        maxLength: 66,
        title: 'Transaction hash',
        isValid: (value: any) => {
          if(typeof value !== "string") return false;
          if(value.length < 66) return false;
          return /0x[0-9a-fA-F]{64}/i.test(value);
        }
      }
    }
  },
}