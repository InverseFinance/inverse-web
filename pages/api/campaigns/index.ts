import { LIQUIDATION_GRANTS_MSG_TO_SIGN } from '@app/components/common/Modal/LiquidationGrantsModal';
import { shortenAddress } from '@app/util';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage, hashMessage } from 'ethers/lib/utils';

interface FieldSettings {
  values?: string[];
  maxLength?: number;
}

interface CampaignSettings {
  title: string;
  sigText: string;
  fields: string[];
  mandatoryFields: string[];
  fieldsSettings: {
    [key: string]: FieldSettings;
  };
}

const CAMPAIGNS_SETTINGS = {
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
}
const CAMPAIGNS = Object.keys(CAMPAIGNS_SETTINGS);

const sendNotifToTeam = async (campaignSettings: CampaignSettings, form: Record<string, string>, address?: string) => {
  const mainValues = Object.entries(form).map(([key, value]) => {
    return `<li>${campaignSettings.fieldsSettings[key]?.title || key}: <strong>${value}</strong></li>`;
  }).join('');

  const to = campaignSettings.to || process.env.REF_EMAIL_TO;

  const user = address ? `User: <a href="https://etherscan.io/address/${address}" target="_blank" rel="noreferrer">${shortenAddress(address)}</a></br></br>` : '';

  let html = `<h1>${campaignSettings.title}</h1><h3>New application!</h3></br></br>${user}<ul>${mainValues}</ul>`

  fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Postmark-Server-Token': process.env.EMAIL_TOKEN,
    },
    body: JSON.stringify({
      From: process.env.REF_EMAIL_FROM,
      To: to,
      Cc: process.env.REF_EMAIL_FROM,
      Subject: campaignSettings.title + ': New application!',
      TextBody: campaignSettings.title + ': New application!',
      HtmlBody: `<html><body>${html}</body></html>`,
      MessageStream: 'outbound',
    }),
  });
}

const checkCampaignValues = (form: Record<string, string>, campaignSettings: CampaignSettings): { valid: boolean; error?: string } => {
  try {
    // Check if form has any fields not defined in campaign settings
    const invalidFields = Object.keys(form).filter(field => !campaignSettings.fields.includes(field));
    if (invalidFields.length > 0) {
      return {
        valid: false,
        error: `Invalid fields found: ${invalidFields.join(', ')}`
      };
    }

    // Check if all mandatory fields are present and not empty
    const missingFields = campaignSettings.mandatoryFields.filter(field => !form[field] || form[field].trim() === '');
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing mandatory fields: ${missingFields.join(', ')}`
      };
    }

    // Check each field against its settings
    for (const [fieldName, fieldValue] of Object.entries(form)) {
      const settings = campaignSettings.fieldsSettings[fieldName];
      if (!settings) continue;

      // Check if value is in allowed values list
      if (settings.values && !settings.values.includes(fieldValue)) {
        return {
          valid: false,
          error: `Invalid value for ${fieldName}. Allowed values: ${settings.values.join(', ')}`
        };
      }

      // Check max length
      if (settings.maxLength && fieldValue.length > settings.maxLength) {
        return {
          valid: false,
          error: `${fieldName} exceeds maximum length of ${settings.maxLength} characters`
        };
      }
    }

    return { valid: true };
  } catch (e) {
    console.error('Error validating campaign values:', e);
    return { valid: false, error: 'Validation error occurred' };
  }
};

const toCsv = (campaignSettings: CampaignSettings, results: any) => {
  const columns = `Date,Account,` + campaignSettings.fields.join(',');
  let CSV = `${columns}\n`;

  results.forEach((d) => {
    const formValues = campaignSettings.fields.map((key) => {
      return `"${d.form[key].replace(/"/gi, '""')}"`;
    }).join(',');
    CSV += `${(new Date(d.timestamp).toUTCString()).replace(/,/g, '')},${d.account},${formValues}\n`;
  });
  return CSV;
}

export default async function handler(req, res) {
  const {
    query,
    method,
  } = req

  const { sig, form } = req.body;

  const { address, campaign, csv, csv_access } = query;
  const campaignListKey = `${campaign}-results`;

  if (!CAMPAIGNS.includes(campaign)) {
    res.status(400).json({ status: 'error', message: 'Invalid campaign' });
    return;
  }

  const campaignSettings = CAMPAIGNS_SETTINGS[campaign];

  if (csv === 'true') {
    if (csv_access !== process.env.REF_CSV_ACCESS) {
      return res.status(400).json({ status: 'error', message: 'Invalid request' });
    } else {
      const campaignCachedData = await getCacheFromRedis(campaignListKey, false, 600) || { results: [] };
      const csvData = toCsv(campaignSettings, campaignCachedData.results);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${campaign}.csv`);
      res.status(200).send(csvData);
      return;
    }
  }

  if (isInvalidGenericParam(address)) {
    console.log('invalid address');
    res.status(400).json({ status: 'error', message: 'Invalid address' });
    return;
  }

  const key = `${campaign}-user-${address}`;
  const cachedResult = (await getCacheFromRedis(key, false, 600));
  const readResult = cachedResult || { applied: false };
  const publicResult = { applied: readResult.applied, timestamp: readResult.timestamp };

  switch (method) {
    case 'GET':
      res.status(200).json(publicResult);
      break
    case 'POST':
      if (cachedResult) {
        res.status(200).json(publicResult);
        return;
      }

      // Add form validation
      const validationResult = checkCampaignValues(form, campaignSettings);
      if (!validationResult.valid) {
        res.status(400).json({
          status: 'error',
          message: validationResult.error || 'Invalid form data'
        });
        return;
      }

      const jsonForm = JSON.stringify(form);

      if (!address || /[<>]/i.test(jsonForm) || /(<script|alert\()/i.test(jsonForm) || /^test$/i.test(jsonForm)) {
        res.status(400).json({ status: 'error', message: 'Invalid values' })
        return
      }
      let sigAddress = '';
      let isMultisig = false;

      const lcAddress = address.toLowerCase();

      const fullMsgToSign = campaignSettings.sigText + lcAddress;

      try {
        sigAddress = verifyMessage(fullMsgToSign, sig);
      } catch (e) {
        console.log(e);
      }

      if (sigAddress?.toLowerCase() !== lcAddress || !sigAddress) {
        // try to verify as multisig
        let multisigVerifyResult;
        try {
          multisigVerifyResult = await verifyMultisigMessage(address, hashMessage(fullMsgToSign), sig);
        } catch (e) {
          console.log('multisig verify error');
          console.log(e);
        }
        if (!multisigVerifyResult?.valid) {
          res.status(401).json({ status: 'warning', message: 'Unauthorized' })
          return
        } else {
          isMultisig = true;
        }
      };
      const campaignCachedData = await getCacheFromRedis(campaignListKey, false, 600) || { results: [] };
      const now = Date.now();
      const result = { applied: true, account: lcAddress, signature: sig, form, isMultisig, timestamp: now };
      await redisSetWithTimestamp(key, result);

      const campaignResults = {
        timestamp: now,
        results: campaignCachedData.results.concat([result]),
      };

      await redisSetWithTimestamp(campaignListKey, campaignResults);

      await sendNotifToTeam(campaignSettings, form, address);
      res.status(200).json({ status: 'success', applied: result.applied, timestamp: result.timestamp });
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}