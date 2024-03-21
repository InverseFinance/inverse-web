import { Payroll } from "@app/types";
import { namedAddress, namedRoles } from "@app/util";
import { Fund } from "./Funds";
import { FundsDetails } from "./FundsDetails";

type Props = {
    currentPayrolls: Payroll[],
    prices: { 
        [key: string]: {
            usd: number
        },
    },
    fundKey?: string,
    title?: string,
    toMonthly?: boolean,
    isLoading?: boolean,
}

export const PayrollDetails = ({
    currentPayrolls,
    prices,
    fundKey = 'amount',
    title = 'DOLA monthly payrolls',
    toMonthly = true,
    isLoading,
}: Props) => {
    const divFactor = toMonthly ? 12 : 1;
    const totalDolaMonthly = currentPayrolls.reduce((prev, curr) => prev + curr[fundKey] / divFactor, 0);

    const payrollsWithRoles = currentPayrolls.map(p => {
        return { role: namedRoles(p.recipient), label: namedAddress(p.recipient), balance: p[fundKey] / divFactor, usdPrice: 1 }
    })

    const roleCosts = Object.entries(payrollsWithRoles.reduce((prev, curr) => {
        return { ...prev, [curr.role]: curr.balance + (prev[curr.role] || 0) }
    }, {})).map(([key, v]) => {
        return {
            label: key,
            balance: v,
            perc: v / totalDolaMonthly * 100,
            usdPrice: prices && prices['dola-usd'] ? prices['dola-usd'].usd : 1,
            drill: payrollsWithRoles.filter(p => p.role === key),
        }
    }) as Fund[];

    return <FundsDetails
        title={title}
        funds={roleCosts}
        type="balance"
        prices={{}}
        isLoading={isLoading}
        labelWithPercInChart={false}
        useRecharts={true}
    />
}