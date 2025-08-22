import { timestampToUTC } from "@app/util/misc"
import { formatDate } from "@app/util/time";
 ;

export const DbrReminder = ({ dbrExpiryDate, dbrBalance }: { dbrExpiryDate: number, dbrBalance: number }) => {
    if(!dbrExpiryDate) return null;
    return <add-to-calendar-button
        name="FiRM - DBR reminder"
        options="'Apple','Google', 'iCal', 'Outlook.com'"
        description={`Note: My DBR balance will be in deficit at this date (with current debt, needs an update if debt changes). I need to buy DBRs before so that I don't get force replenished which would be at a high cost for me!`}
        location="https://inverse.finance/firm"
        startDate={timestampToUTC(dbrExpiryDate)}
        timeZone="UTC"
        uid={`dbr-reminder`}
        size={1}
        inline={true}
        buttonStyle="date"
        label={dbrBalance <= 0 ? 'Depleted' : formatDate(dbrExpiryDate)}
    // lightMode={}
    ></add-to-calendar-button>
}