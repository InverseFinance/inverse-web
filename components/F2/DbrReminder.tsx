import { timestampToUTC } from "@app/util/misc"

export const DbrReminder = ({ dbrExpiryDate, dbrBalance }: { dbrExpiryDate: number, dbrBalance: number }) => {
    return <add-to-calendar-button
        name="FiRM - DBR reminder"
        options="'Apple','Google', 'iCal', 'Outlook.com'"
        description={`NB: My DBR balance will be in deficit at this date (with current debt, needs an update if debt changes). I need to buy DBRs before so that I don't get force replenished which would be at a high cost for me!`}
        location="https://inverse.finance/firm"
        startDate={timestampToUTC(dbrExpiryDate)}
        timeZone="UTC"
        uid={`dbr-reminder`}
        size={1}
        inline={true}
        buttonStyle="date"
        label={dbrBalance <= 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Do, YYYY')}
    // lightMode={}
    ></add-to-calendar-button>
}