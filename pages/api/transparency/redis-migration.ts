import 'source-map-support'
import { migrateOtherKeys, migratePattern, migratePureKeys } from '@app/util/redis'
//firm-oracle-prices-*
//poa-sign-*
//proposal-reviews-*
//user-dbr-balance-histo-*
export default async function handler(req, res) {
    const { k, type, p } = req.query;
    if(process.env.API_SECRET_KEY !== k) {
        return res.status(401).json({ success: false, msg: 'Unauthorized' });
    }
    try {
        if(type === 'pure') {
            await migratePureKeys();
        } else if(type === 'other') {
            await migrateOtherKeys();
        } else if(type === 'pattern') {
            await migratePattern(p);
        }
        return res.status(200).json({ success: true, p, type });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: err });
    }
}